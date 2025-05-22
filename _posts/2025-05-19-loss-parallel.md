---
layout: post
title:  "How To Implement Tensor Parallel Cross Entropy Loss"
date:   2025-05-22 18:00:00 +0000
---

In tensor parallelism (TP), the weight matrix in the output embedding layer is split column-wise, which means each device computes logits for a slice of the vocabulary. Canonical implementations of TP, such as [Megatron-LM](https://arxiv.org/pdf/1909.08053) and [TorchTitan](https://arxiv.org/pdf/2410.06511), advise against performing an all-gather operation on the logits tensor before calculating the loss, as communicating $\text{batch size} \times \text{sequence length} \times \text{vocab size}\$ elements is prohibitively expensive due to the large vocabulary size. Instead, they recommend fusing the output projection directly with the cross-entropy loss computation, sharing only the minimal set of global values necessary to calculate the loss. However, the practical details of how to merge these operations are left implicit, so in this post, I’ll walk through the key implementation considerations.

The code referenced in this post can be found [here](https://github.com/rushilbhat/parallelism-experiments). This repository also contains a broader implementation of TP for nanoGPT, closely following Megatron-LM's approach of replacing the original model layers with custom parallel layers. This ensures compatibility with the FSDP design outlined in my previous post.

## Single-GPU setup

In PyTorch, cross-entropy loss is defined as a functional composition: the log-softmax function first converts logits into log probabilities, and then the negative log-likelihood loss is computed by indexing these log probabilities at the target positions.

The log-softmax function is defined as

$$p_i = \text{log-softmax}(l_i) = \log\left(\frac{e^{l_i-max(l)}}{\sum_j e^{l_j - max(l)}}\right)$$

but is usually rewritten as

$$p_i = l_i - max(l) - \log\left(\sum_j e^{l_j-max(l)}\right)$$

to avoid taking the logarithm of values that may underflow to zero.

Each logit $l_i$ thus directly affects its corresponding log probability $p_i$ as well as indirectly influencing all log probabilities $l_j$ through the global log-sum-exp term. Therefore, during backpropagation, every logit receives at least one gradient contribution through its indirect effect via the global log-sum-exp, and potentially a second contribution through its direct effect on its associated log probability.
Since shiting each logit by $max(l)$ preserves the ratio $\frac{e^{l_i}}{\sum_j e^{l_j}}$, the softmax output is unchanged; hence we can skip backpropagating through the max term.

<figure style="text-align: center;">
  <img src="/assets/images/single-device-ce.png" alt="Single Device CE"/>
  <figcaption>Toy example with a sequence of 2 tokens and a vocabulary size of 4. The arrows trace the gradient paths from the loss back to each logit.</figcaption>
</figure>

## Multi-GPU Setup

With TP, each GPU only holds logits for its local vocabulary shard, so the standard cross-entropy loss needs to be adapted to handle sharded inputs. The first two implementations presented here illustrate how subtle differences in the ordering of the masking and normalisation steps can derail the training process.

### Case A – Disrupted Gradient Flow


Calculating log probabilities involves computing the log-sum-exp over the full vocabulary for each token. Each GPU begins by exponentiating and summing its local logits, after which an all-reduce aggregates the sums across devices, and a logarithm is applied to produce the global normalisation term. Subtracting this from the local logits yields the final log probabilities.

When calculating the negative log-likelihood, we must take special care to avoid out-of-bounds indexing errors when selecting the target log probability for each token. The target IDs lie in the range $\bigl[\,0,\;\text{vocab size}\bigr)$, meaning they assume the availability of log probabilities across the entire vocabulary. However, in a distributed setting, each token only has access to log probabilities within its local shard spanning $\left[0, \frac{\text{vocab size}}{\text{# TP workers}}\right)$. To map the target IDs into the local vocabulary range, we subtract the starting position in the global vocabulary of the shard assigned to the current device. This correctly reindexes IDs for tokens whose target log probabilities fall within the local shard. For target IDs that lie outside the local shard, we clamp the reindexed values to the nearest valid boundary within the local range. To make this concrete, consider our toy example extended to 2-way TP: the targets `[[1], [3]]` are mapped to `[[1], [3]]` on GPU 0 and `[[-1], [1]]` on GPU 1; they are then clipped, giving `[[1], [1]]` and `[[0], [1]]`, respectively. Using the transformed indices, we extract the relevant log probability for each token and subsequently mask the extracted values for tokens whose original targets were out-of-range (i.e. clipped), since these are invalid. An all-reduce operation then follows, summing the masked results so that each worker receives the full set of predicted log probabilities.

However, by masking out each token whose target log-probability doesn't reside on the local device, we inadvertently sever the connection between its logits and the loss. While these logits still influence the loss in the forward pass via the global log-sum-exp, their effect is not captured in the local computation graph. As a result, they receive no gradients during the backward pass.

```python
def vocab_parallel_cross_entropy_loss(logits, targets, tp_group):
    # local_logits: (B, T, V_local)
    # targets: (B, T) full target indices in [0, V)

    tp_rank = dist.get_rank(tp_group)
    local_vocab_size = logits.size(-1)
    vocab_start_idx = tp_rank * local_vocab_size
    vocab_end_idx = vocab_start_idx + local_vocab_size

    mask = (targets >= vocab_start_idx) & (targets < vocab_end_idx)

    local_targets = targets - vocab_start_idx
    local_targets = local_targets.clamp(0, local_vocab_size - 1)

    exp_logits = torch.exp(logits)
    local_sum = exp_logits.sum(dim=-1, keepdim=True)
    global_sum = DifferentiableAllReduce.apply(local_sum,tp_group)
    logsumexp = torch.log(global_sum)

    logprobs = logits - logsumexp

    pred_logprobs = torch.gather(
        logprobs, 
        dim=-1, 
        index=local_targets.unsqueeze(-1)
    ).squeeze(-1)
    pred_logprobs = pred_logprobs * mask.float()
    pred_logprobs = DifferentiableAllReduce.apply(pred_logprobs, tp_group)
    avg_nll_loss = -pred_logprobs.mean()
    return avg_nll_loss
```

<figure style="text-align: center;">
  <img src="/assets/images/disrupted-gradient.png" alt="Disrupted Gradient"/>
  <figcaption>Loss computation with post-hoc masking of log probabilities. Gradients are missing for the second token's logits on Device 0 and for the first token's logits on Device 1.</figcaption>
</figure>

### Case B - Stable Gradient Flow
The key to resolving the gradient propagation issue is keeping the computation graph between the log-sum-exp and the loss intact. Therefore, for each token, we first select the logit at the target position, apply the binary mask to the predicted logits tensor, and only then construct the predicted log probabilities tensor. This reordering allows gradients to pass cleanly through the log-sum-exp to all contributing logits during the backward pass, ensuring training correctness.

```python 
def vocab_parallel_cross_entropy_loss(logits, targets, tp_group):
    # Same setup as Case A up to computation of logsumexp.
    # ...
    pred_logits = torch.gather(
        logits, 
        dim=-1, 
        index=local_targets.unsqueeze(-1)
    ).squeeze(-1)
    pred_logits = pred_logits * mask.float()
    pred_logits = DifferentiableAllReduce.apply(pred_logits, tp_group)

    pred_logprobs = pred_logits - logsumexp
    avg_nll_loss = -pred_logprobs.mean()
    return avg_nll_loss
```

<figure style="text-align: center;">
  <img src="/assets/images/stable-gradient.png" alt="Stable Gradient" />
  <figcaption>Revised loss formulation with pre-masking of logits</figcaption>
</figure>

### Case C – Cutting Communication Costs
 Reworking the loss calculation a second time, we can unlock an easy performance win by replacing the expensive all-reduce on the predicted logits tensor of size $\text{batch size} \times \text{sequence length}$ with an all-reduce over a single scalar:

$$loss =- \frac{1}{B \cdot T} \sum_{i=0}^{B \cdot T} (logit_i - lse_i) = \frac{1}{B \cdot T} \sum_{i=0}^{B \cdot T} lse_i - \frac{1}{B \cdot T} \sum_{i=0}^{B \cdot T} logit_i$$

Since each GPU already has access to all log-sum-exp values, we can compute the global average locally without exchanging any data. The only communication required is to average the local means of the predicted logits across GPUs. The final loss is simply the difference between these two averaged quantities.

```python
def vocab_parallel_cross_entropy_loss(logits, targets, tp_group):
    # Same setup as Case B up to computation of masked pred_logits.
    # ...
    avg_pred_logit = pred_logits.mean()
    avg_logsumexp = logsumexp.mean()
    avg_pred_logit = DifferentiableAllReduce.apply(avg_pred_logit, tp_group)
    avg_nll_loss = avg_logsumexp - avg_pred_logit
    return avg_nll_loss
```