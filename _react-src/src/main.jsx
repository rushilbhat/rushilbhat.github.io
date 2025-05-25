import React from 'react';
import ReactDOM from 'react-dom/client';
import '../styles/tailwind.css';          // generates the CSS

import ModelSplitAnimation from './ModelSplitAnimation';
import GatherUpdate       from './GatherUpdate';
import ShardingAnimation  from './ShardingAnimation';

function mount(id, Component) {
  const node = document.getElementById(id);
  if (node) ReactDOM.createRoot(node).render(<Component />);
}

mount('model-split',  ModelSplitAnimation);
mount('gather-update', GatherUpdate);
mount('sharding',      ShardingAnimation);
