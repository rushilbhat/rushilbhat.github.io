import React, { useState, useEffect, useRef } from 'react';

/**
 * A single chevron arrow that "pulses".
 */
const FatChevron = ({ pulseDelay, reverseArrowDir = false, color = "text-blue-300" }) => {
  const chevronPath = reverseArrowDir
    ? "M20 4 L6 12 L20 20"
    : "M4 4 L18 12 L4 20";

  return (
    <svg
      viewBox="0 0 24 24"
      width="32"
      height="32"
      fill="none"
      stroke="currentColor"
      className={color}
      style={{
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        animationDelay: `${pulseDelay}ms`
      }}
    >
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
      <path
        d={chevronPath}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

/**
 * AnimatedChevrons
 */
const AnimatedChevrons = ({
  isVisible,
  fadeOutIndex = -1,
  fadeOutIndexReverse = -1,
  reverseFadeIn = false,
  reverseArrowDir = false,
  reversePulseOrder = false,
  color = "text-blue-300"
}) => {
  const [visibleChevrons, setVisibleChevrons] = useState([false, false, false]);

  useEffect(() => {
    if (isVisible) {
      // Choose the order in which they become visible
      const sequence = reverseFadeIn ? [2, 1, 0] : [0, 1, 2];

      const timers = sequence.map((index, i) =>
        setTimeout(() => {
          setVisibleChevrons((prev) => {
            const next = [...prev];
            next[index] = true;
            return next;
          });
        }, i * 200)
      );

      return () => timers.forEach(clearTimeout);
    } else {
      // Reset if not visible
      setVisibleChevrons([false, false, false]);
    }
  }, [isVisible, reverseFadeIn]);

  return (
    <div className="flex items-center space-x-2">
      {[0, 1, 2].map((index) => {
        // Decide the pulse order: normally it's index * 300, reversed is (2 - index) * 300
        const pulseIndex = reversePulseOrder ? 2 - index : index;
        return (
          <div
            key={index}
            className="transition-opacity duration-1000 ease-in-out"
            style={{
              opacity: visibleChevrons[index] && 
                      fadeOutIndex < index && 
                      (fadeOutIndexReverse === -1 || (2 - fadeOutIndexReverse) > index) ? 1 : 0,
            }}
          >
            <FatChevron
              pulseDelay={pulseIndex * 300}
              reverseArrowDir={reverseArrowDir}
              color={color}
            />
          </div>
        );
      })}
    </div>
  );
};

const ModelSplitAnimation = () => {
  // =========================
  // Scaling logic
  // =========================
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const [scale, setScale] = useState(1);

  // Calculate and update scale
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;

      // Get container width (minus padding)
      const containerWidth = container.clientWidth - 32; // 16px padding on each side

      // Animation dimensions:
      const animationWidth = 1156;
      const animationHeight = 608;

      // Calculate scale based on width only since height is auto
      const newScale = Math.min(containerWidth / animationWidth, 1); // Never scale up beyond 1

      setScale(newScale);
    };

    // Create ResizeObserver to watch for container size changes
    const resizeObserver = new ResizeObserver(() => {
      updateScale();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Initial scale calculation
    updateScale();

    // Also listen to window resize
    window.addEventListener('resize', updateScale);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, []);

  // =========================
  // Basic top-level animations
  // =========================
  const [isSplit, setIsSplit] = useState(false);
  const [showGPUs, setShowGPUs] = useState(false);
  const [showHalvesUnit0, setShowHalvesUnit0] = useState(false);
  const [showHalvesUnit1, setShowHalvesUnit1] = useState(false);
  const [showHalvesUnit2, setShowHalvesUnit2] = useState(false);
  const [centerGPUs, setCenterGPUs] = useState(false);
  const [showInternalStructure, setShowInternalStructure] = useState(false);

  // ===============================
  // FIRST chevron set (anchored to Unit0)
  // ===============================
  const [showChevrons, setShowChevrons] = useState(false);
  const [chevronFadeOutIndex, setChevronFadeOutIndex] = useState(-1);

  // ===============================
  // SECOND chevron set (anchored to Unit2) - original
  // (Expand final params on Unit2, show per-step, shrink, etc.)
  // ===============================
  const [showChevrons2, setShowChevrons2] = useState(false);
  const [chevrons2FadeOutIndex, setChevrons2FadeOutIndex] = useState(-1);
  const [expandUnit2ParamsFinal, setExpandUnit2ParamsFinal] = useState(false);
  const [showPerstepGrads, setShowPerstepGrads] = useState(false);
  const [shrinkPerstepGrads, setShrinkPerstepGrads] = useState(false);
  const [translatePerstepGrads1, setTranslatePerstepGrads1] = useState(false);
  const [translatePerstepGrads2, setTranslatePerstepGrads2] = useState(false);
  const [hideGpu1Perstep1, setHideGpu1Perstep1] = useState(false);
  const [hideGpu0Perstep2, setHideGpu0Perstep2] = useState(false);
  const [finalTranslatePerstep, setFinalTranslatePerstep] = useState(false);

  // Glow states for GPU0 / GPU1 while per-step grads move
  const [showTemporaryGlow, setShowTemporaryGlow] = useState(false);
  const [showTemporaryGlow1, setShowTemporaryGlow1] = useState(false);

  // Glow effect for Unit2's grads box on both GPUs after final
  const [showTemporaryGlowUnit2Grads, setShowTemporaryGlowUnit2Grads] = useState(false);
  const [showTemporaryGlowUnit2GradsGpu1, setShowTemporaryGlowUnit2GradsGpu1] = useState(false);

  // Hide Unit2 Activations box after final
  const [hideUnit2Activations, setHideUnit2Activations] = useState(false);

  // Shrink the final expanded Params box on Unit2
  const [shrinkExpandedParams, setShrinkExpandedParams] = useState(false);

  // ===============================
  // SEQUENCE for Unit1 (just like Unit2)
  // ===============================
  const [expandUnit1ParamsFinal, setExpandUnit1ParamsFinal] = useState(false);
  const [showPerstepGradsU1, setShowPerstepGradsU1] = useState(false);
  const [shrinkPerstepGradsU1, setShrinkPerstepGradsU1] = useState(false);
  const [translatePerstepGrads1U1, setTranslatePerstepGrads1U1] = useState(false);
  const [translatePerstepGrads2U1, setTranslatePerstepGrads2U1] = useState(false);
  const [hideGpu1Perstep1U1, setHideGpu1Perstep1U1] = useState(false);
  const [hideGpu0Perstep2U1, setHideGpu0Perstep2U1] = useState(false);
  const [finalTranslatePerstepU1, setFinalTranslatePerstepU1] = useState(false);

  // Glow states (Unit1)
  const [showTemporaryGlowU1Gpu0, setShowTemporaryGlowU1Gpu0] = useState(false);
  const [showTemporaryGlowU1Gpu1, setShowTemporaryGlowU1Gpu1] = useState(false);
  const [showTemporaryGlowUnit1GradsGpu0, setShowTemporaryGlowUnit1GradsGpu0] = useState(false);
  const [showTemporaryGlowUnit1GradsGpu1, setShowTemporaryGlowUnit1GradsGpu1] = useState(false);

  // Hide Unit1 Activations & shrink final box
  const [hideUnit1Activations, setHideUnit1Activations] = useState(false);
  const [shrinkExpandedParamsU1, setShrinkExpandedParamsU1] = useState(false);

  // ===============================
  // SEQUENCE for Unit0 (NEW)
  // ===============================
  const [expandUnit0ParamsFinal, setExpandUnit0ParamsFinal] = useState(false);
  const [showPerstepGradsU0, setShowPerstepGradsU0] = useState(false);
  const [shrinkPerstepGradsU0, setShrinkPerstepGradsU0] = useState(false);
  const [translatePerstepGrads1U0, setTranslatePerstepGrads1U0] = useState(false);
  const [translatePerstepGrads2U0, setTranslatePerstepGrads2U0] = useState(false);
  const [hideGpu1Perstep1U0, setHideGpu1Perstep1U0] = useState(false);
  const [hideGpu0Perstep2U0, setHideGpu0Perstep2U0] = useState(false);
  const [finalTranslatePerstepU0, setFinalTranslatePerstepU0] = useState(false);

  // Glow states (Unit0)
  const [showTemporaryGlowU0Gpu0, setShowTemporaryGlowU0Gpu0] = useState(false);
  const [showTemporaryGlowU0Gpu1, setShowTemporaryGlowU0Gpu1] = useState(false);
  const [showTemporaryGlowUnit0GradsGpu0, setShowTemporaryGlowUnit0GradsGpu0] = useState(false);
  const [showTemporaryGlowUnit0GradsGpu1, setShowTemporaryGlowUnit0GradsGpu1] = useState(false);

  // Hide Unit0 Activations & shrink final box
  const [hideUnit0Activations, setHideUnit0Activations] = useState(false);
  const [shrinkExpandedParamsU0, setShrinkExpandedParamsU0] = useState(false);

  // ===============================
  // Basic expansions for each Unit
  // ===============================
  const [expandParamsBox, setExpandParamsBox] = useState([false, false, false]);
  const [showActivationsBox, setShowActivationsBox] = useState([false, false, false]);
  const [shrinkParamsBox, setShrinkParamsBox] = useState([false, false, false]);

  // Trigger to restart the entire sequence
  const [shouldReset, setShouldReset] = useState(false);

  // =====================================
  // Effect watchers for the Unit2 sequence
  // =====================================

  // 1) Translate per-step for GPU1 => glow => hide
  useEffect(() => {
    if (translatePerstepGrads1) {
      const showGlowTimer = setTimeout(() => {
        setShowTemporaryGlow1(true);
        const hideGlowTimer = setTimeout(() => {
          setShowTemporaryGlow1(false);
          setHideGpu1Perstep1(true);
        }, 1000);
        return () => clearTimeout(hideGlowTimer);
      }, 300);
      return () => clearTimeout(showGlowTimer);
    }
  }, [translatePerstepGrads1]);

  // 2) Translate per-step for GPU0 => glow => hide => final
  useEffect(() => {
    if (translatePerstepGrads2) {
      const showGlowTimer = setTimeout(() => {
        setShowTemporaryGlow(true);
        const hideGlowTimer = setTimeout(() => {
          setShowTemporaryGlow(false);
          setHideGpu0Perstep2(true);

          // Start the final transition after a delay
          const finalTransitionTimer = setTimeout(() => {
            setFinalTranslatePerstep(true);
          }, 500);

          return () => clearTimeout(finalTransitionTimer);
        }, 1000);
        return () => clearTimeout(hideGlowTimer);
      }, 300);
      return () => clearTimeout(showGlowTimer);
    }
  }, [translatePerstepGrads2]);

  // 3) finalTranslatePerstep => glow on grads box => hide
  useEffect(() => {
    if (finalTranslatePerstep) {
      // GPU0 glow
      const showGlowTimerGpu0 = setTimeout(() => {
        setShowTemporaryGlowUnit2Grads(true);
        const hideGlowTimerGpu0 = setTimeout(() => {
          setShowTemporaryGlowUnit2Grads(false);
        }, 1000);
        return () => clearTimeout(hideGlowTimerGpu0);
      }, 300);

      // GPU1 glow
      const showGlowTimerGpu1 = setTimeout(() => {
        setShowTemporaryGlowUnit2GradsGpu1(true);
        const hideGlowTimerGpu1 = setTimeout(() => {
          setShowTemporaryGlowUnit2GradsGpu1(false);
        }, 1000);
        return () => clearTimeout(hideGlowTimerGpu1);
      }, 300);

      return () => {
        clearTimeout(showGlowTimerGpu0);
        clearTimeout(showGlowTimerGpu1);
      };
    }
  }, [finalTranslatePerstep]);

  // 4) Hide Unit2 activations and shrink final box
  useEffect(() => {
    if (finalTranslatePerstep) {
      const hideActivationsTimer = setTimeout(() => {
        setHideUnit2Activations(true);
        // Then shrink the expanded params
        const shrinkParamsTimer = setTimeout(() => {
          setShrinkExpandedParams(true);
        }, 500);
        return () => clearTimeout(shrinkParamsTimer);
      }, 1500);

      return () => clearTimeout(hideActivationsTimer);
    }
  }, [finalTranslatePerstep]);


  // =====================================
  // Unit1 sequence watchers (same pattern)
  // =====================================

  // Start Unit1 sequence after shrinking final box on Unit2
  useEffect(() => {
    if (shrinkExpandedParams) {
      const startUnit1Timer = setTimeout(() => {
        setExpandUnit1ParamsFinal(true);

        const showPerstepTimer = setTimeout(() => {
          setShowPerstepGradsU1(true);

          const shrinkPerstepTimer = setTimeout(() => {
            setShrinkPerstepGradsU1(true);

            // Then do translates
            const translateTimer = setTimeout(() => {
              setTranslatePerstepGrads1U1(true);
              setTranslatePerstepGrads2U1(true);
            }, 1000);

            return () => clearTimeout(translateTimer);
          }, 1000);

          return () => clearTimeout(shrinkPerstepTimer);
        }, 1000);

        return () => clearTimeout(showPerstepTimer);
      }, 1000);

      return () => clearTimeout(startUnit1Timer);
    }
  }, [shrinkExpandedParams]);

  // Translate per-step for GPU1 => glow => hide (Unit1)
  useEffect(() => {
    if (translatePerstepGrads1U1) {
      const showGlowTimer = setTimeout(() => {
        setShowTemporaryGlowU1Gpu1(true);
        const hideGlowTimer = setTimeout(() => {
          setShowTemporaryGlowU1Gpu1(false);
          setHideGpu1Perstep1U1(true);
        }, 1000);
        return () => clearTimeout(hideGlowTimer);
      }, 300);
      return () => clearTimeout(showGlowTimer);
    }
  }, [translatePerstepGrads1U1]);

  // Translate per-step for GPU0 => glow => hide => final (Unit1)
  useEffect(() => {
    if (translatePerstepGrads2U1) {
      const showGlowTimer = setTimeout(() => {
        setShowTemporaryGlowU1Gpu0(true);
        const hideGlowTimer = setTimeout(() => {
          setShowTemporaryGlowU1Gpu0(false);
          setHideGpu0Perstep2U1(true);

          // final
          const finalTransitionTimer = setTimeout(() => {
            setFinalTranslatePerstepU1(true);
          }, 500);

          return () => clearTimeout(finalTransitionTimer);
        }, 1000);
        return () => clearTimeout(hideGlowTimer);
      }, 300);
      return () => clearTimeout(showGlowTimer);
    }
  }, [translatePerstepGrads2U1]);

  // finalTranslatePerstepU1 => glow on Unit1 grads box => ...
  useEffect(() => {
    if (finalTranslatePerstepU1) {
      // GPU0
      const showGlowTimerGpu0 = setTimeout(() => {
        setShowTemporaryGlowUnit1GradsGpu0(true);
        const hideGlowTimerGpu0 = setTimeout(() => {
          setShowTemporaryGlowUnit1GradsGpu0(false);
        }, 1000);
        return () => clearTimeout(hideGlowTimerGpu0);
      }, 300);

      // GPU1
      const showGlowTimerGpu1 = setTimeout(() => {
        setShowTemporaryGlowUnit1GradsGpu1(true);
        const hideGlowTimerGpu1 = setTimeout(() => {
          setShowTemporaryGlowUnit1GradsGpu1(false);
        }, 1000);
        return () => clearTimeout(hideGlowTimerGpu1);
      }, 300);

      return () => {
        clearTimeout(showGlowTimerGpu0);
        clearTimeout(showGlowTimerGpu1);
      };
    }
  }, [finalTranslatePerstepU1]);

  // Hide Unit1 activations, shrink Unit1 final box
  useEffect(() => {
    if (finalTranslatePerstepU1) {
      const hideActivationsTimer = setTimeout(() => {
        setHideUnit1Activations(true);
        const shrinkParamsTimer = setTimeout(() => {
          setShrinkExpandedParamsU1(true);
        }, 500);
        return () => clearTimeout(shrinkParamsTimer);
      }, 1500);

      return () => clearTimeout(hideActivationsTimer);
    }
  }, [finalTranslatePerstepU1]);


  // =====================================
  // Unit0 sequence watchers (NEW)
  // =====================================

  // Start Unit0 sequence after shrinking final box on Unit1
  useEffect(() => {
    if (shrinkExpandedParamsU1) {
      const startUnit0Timer = setTimeout(() => {
        setExpandUnit0ParamsFinal(true);

        const showPerstepTimer = setTimeout(() => {
          setShowPerstepGradsU0(true);

          const shrinkPerstepTimer = setTimeout(() => {
            setShrinkPerstepGradsU0(true);

            // Then do the translates
            const translateTimer = setTimeout(() => {
              setTranslatePerstepGrads1U0(true);
              setTranslatePerstepGrads2U0(true);
            }, 1000);

            return () => clearTimeout(translateTimer);
          }, 1000);

          return () => clearTimeout(shrinkPerstepTimer);
        }, 1000);

        return () => clearTimeout(showPerstepTimer);
      }, 1000);

      return () => clearTimeout(startUnit0Timer);
    }
  }, [shrinkExpandedParamsU1]);

  // Translate per-step for GPU1 => glow => hide (Unit0)
  useEffect(() => {
    if (translatePerstepGrads1U0) {
      const showGlowTimer = setTimeout(() => {
        setShowTemporaryGlowU0Gpu1(true);
        const hideGlowTimer = setTimeout(() => {
          setShowTemporaryGlowU0Gpu1(false);
          setHideGpu1Perstep1U0(true);
        }, 1000);
        return () => clearTimeout(hideGlowTimer);
      }, 300);
      return () => clearTimeout(showGlowTimer);
    }
  }, [translatePerstepGrads1U0]);

  // Translate per-step for GPU0 => glow => hide => final (Unit0)
  useEffect(() => {
    if (translatePerstepGrads2U0) {
      const showGlowTimer = setTimeout(() => {
        setShowTemporaryGlowU0Gpu0(true);
        const hideGlowTimer = setTimeout(() => {
          setShowTemporaryGlowU0Gpu0(false);
          setHideGpu0Perstep2U0(true);

          // final
          const finalTransitionTimer = setTimeout(() => {
            setFinalTranslatePerstepU0(true);
          }, 500);

          return () => clearTimeout(finalTransitionTimer);
        }, 1000);
        return () => clearTimeout(hideGlowTimer);
      }, 300);
      return () => clearTimeout(showGlowTimer);
    }
  }, [translatePerstepGrads2U0]);

  // finalTranslatePerstepU0 => glow on Unit0 grads box => ...
  useEffect(() => {
    if (finalTranslatePerstepU0) {
      // GPU0
      const showGlowTimerGpu0 = setTimeout(() => {
        setShowTemporaryGlowUnit0GradsGpu0(true);
        const hideGlowTimerGpu0 = setTimeout(() => {
          setShowTemporaryGlowUnit0GradsGpu0(false);
        }, 1000);
        return () => clearTimeout(hideGlowTimerGpu0);
      }, 300);

      // GPU1
      const showGlowTimerGpu1 = setTimeout(() => {
        setShowTemporaryGlowUnit0GradsGpu1(true);
        const hideGlowTimerGpu1 = setTimeout(() => {
          setShowTemporaryGlowUnit0GradsGpu1(false);
        }, 1000);
        return () => clearTimeout(hideGlowTimerGpu1);
      }, 300);

      return () => {
        clearTimeout(showGlowTimerGpu0);
        clearTimeout(showGlowTimerGpu1);
      };
    }
  }, [finalTranslatePerstepU0]);

  // Hide Unit0 activations, shrink Unit0 final box
  useEffect(() => {
    if (finalTranslatePerstepU0) {
      const hideActivationsTimer = setTimeout(() => {
        setHideUnit0Activations(true);
        const shrinkParamsTimer = setTimeout(() => {
          setShrinkExpandedParamsU0(true);
        }, 500);
        return () => clearTimeout(shrinkParamsTimer);
      }, 1500);

      return () => clearTimeout(hideActivationsTimer);
    }
  }, [finalTranslatePerstepU0]);

  // Effect to handle the fade out of second chevron set after Unit0 is done
  useEffect(() => {
    if (shrinkExpandedParamsU0) {
      // Start fading out the second set of chevrons from right to left
      const fadeOutSequence = [0, 1, 2].map((i) => {
        return setTimeout(() => {
          setChevrons2FadeOutIndex(i);
        }, 1000 + i * 700);
      });

      return () => fadeOutSequence.forEach(clearTimeout);
    }
  }, [shrinkExpandedParamsU0]);

  // Watch for when second set of chevrons finishes fading out to trigger reset
  useEffect(() => {
    if (chevrons2FadeOutIndex === 2) {
      const resetTimer = setTimeout(() => {
        // Reset all states to their initial values
        setIsSplit(false);
        setShowGPUs(false);
        setShowHalvesUnit0(false);
        setShowHalvesUnit1(false);
        setShowHalvesUnit2(false);
        setCenterGPUs(false);
        setShowInternalStructure(false);
        
        // Reset Unit2 states
        setExpandUnit2ParamsFinal(false);
        setShowPerstepGrads(false);
        setShrinkPerstepGrads(false);
        setTranslatePerstepGrads1(false);
        setTranslatePerstepGrads2(false);
        setHideGpu1Perstep1(false);
        setHideGpu0Perstep2(false);
        setFinalTranslatePerstep(false);
        setShowTemporaryGlow(false);
        setShowTemporaryGlow1(false);
        setShowTemporaryGlowUnit2Grads(false);
        setShowTemporaryGlowUnit2GradsGpu1(false);
        setHideUnit2Activations(false);
        setShrinkExpandedParams(false);
        
        // Reset Unit1 states
        setExpandUnit1ParamsFinal(false);
        setShowPerstepGradsU1(false);
        setShrinkPerstepGradsU1(false);
        setTranslatePerstepGrads1U1(false);
        setTranslatePerstepGrads2U1(false);
        setHideGpu1Perstep1U1(false);
        setHideGpu0Perstep2U1(false);
        setFinalTranslatePerstepU1(false);
        setShowTemporaryGlowU1Gpu0(false);
        setShowTemporaryGlowU1Gpu1(false);
        setShowTemporaryGlowUnit1GradsGpu0(false);
        setShowTemporaryGlowUnit1GradsGpu1(false);
        setHideUnit1Activations(false);
        setShrinkExpandedParamsU1(false);
        
        // Reset Unit0 states
        setExpandUnit0ParamsFinal(false);
        setShowPerstepGradsU0(false);
        setShrinkPerstepGradsU0(false);
        setTranslatePerstepGrads1U0(false);
        setTranslatePerstepGrads2U0(false);
        setHideGpu1Perstep1U0(false);
        setHideGpu0Perstep2U0(false);
        setFinalTranslatePerstepU0(false);
        setShowTemporaryGlowU0Gpu0(false);
        setShowTemporaryGlowU0Gpu1(false);
        setShowTemporaryGlowUnit0GradsGpu0(false);
        setShowTemporaryGlowUnit0GradsGpu1(false);
        setHideUnit0Activations(false);
        setShrinkExpandedParamsU0(false);
        
        // Reset basic expansions
        setExpandParamsBox([false, false, false]);
        setShowActivationsBox([false, false, false]);
        setShrinkParamsBox([false, false, false]);
        
        // Reset chevrons
        setShowChevrons(false);
        setChevronFadeOutIndex(-1);
        setShowChevrons2(false);
        setChevrons2FadeOutIndex(-1);

        // Trigger the animation to start again
        setShouldReset((prev) => !prev);
      }, 1500);

      return () => clearTimeout(resetTimer);
    }
  }, [chevrons2FadeOutIndex]);

  // ===============================
  // The main (global) sequence on mount
  // ===============================
  useEffect(() => {
    // Start the entire sequence after a short delay
    const splitTimer = setTimeout(() => {
      setIsSplit(true);

      const gpuTimer = setTimeout(() => {
        setShowGPUs(true);

        const halves0Timer = setTimeout(() => {
          setShowHalvesUnit0(true);

          const halves1Timer = setTimeout(() => {
            setShowHalvesUnit1(true);

            const halves2Timer = setTimeout(() => {
              setShowHalvesUnit2(true);

              const centerTimer = setTimeout(() => {
                setCenterGPUs(true);

                const structureTimer = setTimeout(() => {
                  setShowInternalStructure(true);

                  // Now show the first set of chevrons
                  const chevronsTimer = setTimeout(() => {
                    setShowChevrons(true);

                    // Helper to animate each unit's Param/Activations expansions
                    const createUnitSequence = (unitIndex, prevTimers = []) => {
                      // Expand Param box
                      const expandParamsTimer = setTimeout(() => {
                        setExpandParamsBox((prev) => {
                          const next = [...prev];
                          next[unitIndex] = true;
                          return next;
                        });

                        // Show Activations box
                        const showActivationsBoxTimer = setTimeout(() => {
                          setShowActivationsBox((prev) => {
                            const next = [...prev];
                            next[unitIndex] = true;
                            return next;
                          });

                          // Shrink Param box
                          const shrinkParamsTimer = setTimeout(() => {
                            setShrinkParamsBox((prev) => {
                              const next = [...prev];
                              next[unitIndex] = true;
                              return next;
                            });

                            // Move to next unit, or fade out chevrons & show second set
                            if (unitIndex < 2) {
                              createUnitSequence(unitIndex + 1, [
                                ...prevTimers,
                                expandParamsTimer,
                                showActivationsBoxTimer,
                                shrinkParamsTimer
                              ]);
                            } else {
                              // After all three units are done, fade out the first set of chevrons
                              const fadeOutSequence = [0, 1, 2].map((i) => {
                                return setTimeout(() => {
                                  setChevronFadeOutIndex(i);
                                }, 1000 + i * 700);
                              });

                              // After they've fully faded, show the second set (Unit2)
                              const finalFadeOutTimer = setTimeout(() => {
                                setShowChevrons2(true);
                                
                                // Expand params box for Unit2
                                const expandParamsFinalTimer = setTimeout(() => {
                                  setExpandUnit2ParamsFinal(true);
                                  
                                  // Then show perstepgrads after params expansion
                                  const perstepGradsTimer = setTimeout(() => {
                                    setShowPerstepGrads(true);

                                    // After showing perstep grads, shrink their widths
                                    const shrinkTimer = setTimeout(() => {
                                      setShrinkPerstepGrads(true);

                                      // Then translate Per-step grads
                                      const translateTimer = setTimeout(() => {
                                        setTranslatePerstepGrads1(true);
                                        setTranslatePerstepGrads2(true);
                                      }, 1000);

                                      return () => {
                                        clearTimeout(shrinkTimer);
                                        clearTimeout(translateTimer);
                                      };
                                    }, 1000);

                                    return () => {
                                      [...prevTimers, ...fadeOutSequence].forEach(clearTimeout);
                                      clearTimeout(finalFadeOutTimer);
                                      clearTimeout(expandParamsFinalTimer);
                                      clearTimeout(perstepGradsTimer);
                                    };
                                  }, 1000);

                                  return () => {
                                    [...prevTimers, ...fadeOutSequence].forEach(clearTimeout);
                                    clearTimeout(finalFadeOutTimer);
                                    clearTimeout(expandParamsFinalTimer);
                                  };
                                }, 1000);

                                return () => {
                                  [...prevTimers, ...fadeOutSequence].forEach(clearTimeout);
                                  clearTimeout(finalFadeOutTimer);
                                  clearTimeout(expandParamsFinalTimer);
                                };
                              }, 3400);
                            }
                          }, 1500);

                          return () => {
                            [...prevTimers, expandParamsTimer, showActivationsBoxTimer].forEach(clearTimeout);
                          };
                        }, 1000);

                        return () => {
                          [...prevTimers, expandParamsTimer].forEach(clearTimeout);
                        };
                      }, 1000);

                      return () => {
                        [...prevTimers, expandParamsTimer].forEach(clearTimeout);
                      };
                    };

                    // Kick off expansions at Unit0
                    createUnitSequence(0);
                  }, 1000);

                  return () => clearTimeout(chevronsTimer);
                }, 1000);

                return () => clearTimeout(structureTimer);
              }, 1200);

              return () => clearTimeout(centerTimer);
            }, 1200);

            return () => clearTimeout(halves2Timer);
          }, 1200);

          return () => clearTimeout(halves1Timer);
        }, 1200);

        return () => clearTimeout(gpuTimer);
      }, 1000);

      return () => clearTimeout(splitTimer);
    }, 2000);

    // Cleanup on re-run
    return () => clearTimeout(splitTimer);
  }, [shouldReset]);

  // =========================
  // Render
  // =========================
  return (
    <div
      ref={containerRef}
      className="w-full h-auto flex items-center justify-center p-4" //border-2 border-red-500 overflow-hidden
      style={{
        backgroundColor: '#fdfdfd',
        position: 'relative'
      }}
    >
      {/* Animation wrapper with scaling */}
      <div 
        style={{
          width: `${1156 * scale}px`,
          height: `${608 * scale}px`,
          position: 'relative'
        }}
      >
        <div 
          ref={animationRef}
          className="absolute inset-0"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            width: '1156px',
            height: '608px'
          }}
        >
        {/* Main container for animation */}
        <div className="relative w-full h-full flex items-center justify-center">
          
          {/* Units Container */}
          <div
            className={`transition-all duration-[1000ms] 
                        ${centerGPUs ? 'opacity-0' : 'opacity-100'}
                        flex justify-center items-center`}
          >
            <div className="relative flex justify-center items-center">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="border-2 border-black rounded-xl absolute 
                    flex items-center justify-center bg-white
                    transition-all duration-500 ease-in-out"
                  style={{
                    transform: isSplit
                      ? `translateX(${(i - 1) * 176}px)`
                      : 'translateX(0)',
                    opacity: isSplit 
                      ? (i === 0 && showHalvesUnit0
                          ? 0
                          : i === 1 && showHalvesUnit1
                          ? 0
                          : i === 2 && showHalvesUnit2
                          ? 0
                          : 1)
                      : i === 1
                      ? 1
                      : 0,
                    width: isSplit ? '160px' : '480px',
                    height: '160px',
                    zIndex: i === 1 ? 2 : 1
                  }}
                >
                  <span className="text-xl">
                    {isSplit ? `Unit${i}` : i === 1 ? 'Model' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* GPUs Container */}
          <div
            className={`
              transition-all duration-1000 ease-in-out
              ${showGPUs ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
              ${centerGPUs ? '' : 'translate-x-[300px]'}
              flex flex-col space-y-8`}
          >
            {[0, 1].map((gpuIndex) => (
              <div
                key={gpuIndex}
                className={`h-72 border-2 border-black rounded-xl 
                  bg-white relative
                  transition-all duration-[1000ms] ease-in-out
                  ${showGPUs ? 'opacity-100' : 'opacity-0'}`}
                style={{
                  width: showGPUs ? '520px' : '0px',
                  transitionDelay: `${gpuIndex * 200}ms`
                }}
              >
                <span className="absolute bottom-2 right-2 text-xl">GPU{gpuIndex}</span>

                {/* Inside each GPU, place 3 Unit placeholders */}
                <div className="w-full h-full p-4 flex justify-center items-center gap-4">
                  {[0, 1, 2].map((unitIndex) => (
                    <div key={unitIndex} className="w-40 h-40 relative">
                      {/* ============================ */}
                      {/* Per-step grads for Unit2    */}
                      {/* ============================ */}
                      {unitIndex === 2 && (
                        <>
                          {/* Per-step grads 1 (Unit2) */}
                          <div
                            className="absolute border-2 border-solid border-black rounded-xl bg-white
                              transition-all duration-1000"
                            style={{
                              height: '25%',
                              width: shrinkPerstepGrads ? '50%' : '100%',
                              top: '-25%',
                              left: 0,
                              opacity:
                                gpuIndex === 1 && hideGpu1Perstep1
                                  ? 0
                                  : showPerstepGrads
                                  ? 1
                                  : 0,
                              transform:
                                translatePerstepGrads1 && gpuIndex === 1
                                  ? 'translateY(-320px) scale(0.9)'
                                  : finalTranslatePerstep && gpuIndex === 0
                                  ? 'translateY(80px) scale(0.9)'
                                  : 'none',
                              zIndex: translatePerstepGrads1
                                ? gpuIndex === 1
                                  ? 10
                                  : 30
                                : 'auto',
                              backgroundColor:
                                translatePerstepGrads1 &&
                                gpuIndex === 0 &&
                                showTemporaryGlow1
                                  ? 'rgba(255, 200, 200, 1)'
                                  : 'white'
                            }}
                          >
                            <span className="text-xs absolute top-1/2 left-1/2 
                              -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-center"
                            >
                              {shrinkPerstepGrads ? (
                                <>
                                  Micro-grads
                                  <br />
                                  (shard)
                                </>
                              ) : (
                                <>
                                  Micro-grads
                                </>
                              )}
                            </span>
                          </div>

                          {/* Per-step grads 2 (Unit2) */}
                          <div
                            className="absolute border-2 border-solid border-black rounded-xl bg-white
                              transition-all duration-1000"
                            style={{
                              height: '25%',
                              width: shrinkPerstepGrads ? '50%' : '100%',
                              top: '-25%',
                              right: 0,
                              opacity:
                                gpuIndex === 0 && hideGpu0Perstep2
                                  ? 0
                                  : showPerstepGrads
                                  ? 1
                                  : 0,
                              transform:
                                translatePerstepGrads2 && gpuIndex === 0
                                  ? 'translateY(320px) scale(0.9)'
                                  : finalTranslatePerstep && gpuIndex === 1
                                  ? 'translateY(80px) scale(0.9)'
                                  : 'none',
                              zIndex: translatePerstepGrads2
                                ? gpuIndex === 0
                                  ? 10
                                  : 30
                                : 'auto',
                              backgroundColor:
                                translatePerstepGrads2 &&
                                gpuIndex === 1 &&
                                showTemporaryGlow
                                  ? 'rgba(255, 200, 200, 1)'
                                  : 'white'
                            }}
                          >
                            <span className="text-xs absolute top-1/2 left-1/2 
                              -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-center"
                            >
                              {shrinkPerstepGrads ? (
                                <>
                                  Micro-grads
                                  <br />
                                  (shard)
                                </>
                              ) : (
                                <>
                                  Micro-grads
                                </>
                              )}
                            </span>
                          </div>
                        </>
                      )}

                      {/* ============================ */}
                      {/* Per-step grads for Unit1    */}
                      {/* ============================ */}
                      {unitIndex === 1 && (
                        <>
                          {/* Per-step grads 1 (Unit1) */}
                          <div
                            className="absolute border-2 border-solid border-black rounded-xl bg-white
                              transition-all duration-1000"
                            style={{
                              height: '25%',
                              width: shrinkPerstepGradsU1 ? '50%' : '100%',
                              top: '-25%',
                              left: 0,
                              opacity:
                                gpuIndex === 1 && hideGpu1Perstep1U1
                                  ? 0
                                  : showPerstepGradsU1
                                  ? 1
                                  : 0,
                              transform:
                                translatePerstepGrads1U1 && gpuIndex === 1
                                  ? 'translateY(-320px) scale(0.9)'
                                  : finalTranslatePerstepU1 && gpuIndex === 0
                                  ? 'translateY(80px) scale(0.9)'
                                  : 'none',
                              zIndex: translatePerstepGrads1U1
                                ? gpuIndex === 1
                                  ? 10
                                  : 30
                                : 'auto',
                              backgroundColor:
                                translatePerstepGrads1U1 &&
                                gpuIndex === 0 &&
                                showTemporaryGlowU1Gpu1
                                  ? 'rgba(255, 200, 200, 1)'
                                  : 'white'
                            }}
                          >
                            <span className="text-xs absolute top-1/2 left-1/2 
                              -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-center"
                            >
                              {shrinkPerstepGradsU1 ? (
                                <>
                                  Micro-grads
                                  <br />
                                  (shard)
                                </>
                              ) : (
                                <>
                                  Micro-grads
                                </>
                              )}
                            </span>
                          </div>

                          {/* Per-step grads 2 (Unit1) */}
                          <div
                            className="absolute border-2 border-solid border-black rounded-xl bg-white
                              transition-all duration-1000"
                            style={{
                              height: '25%',
                              width: shrinkPerstepGradsU1 ? '50%' : '100%',
                              top: '-25%',
                              right: 0,
                              opacity:
                                gpuIndex === 0 && hideGpu0Perstep2U1
                                  ? 0
                                  : showPerstepGradsU1
                                  ? 1
                                  : 0,
                              transform:
                                translatePerstepGrads2U1 && gpuIndex === 0
                                  ? 'translateY(320px) scale(0.9)'
                                  : finalTranslatePerstepU1 && gpuIndex === 1
                                  ? 'translateY(80px) scale(0.9)'
                                  : 'none',
                              zIndex: translatePerstepGrads2U1
                                ? gpuIndex === 0
                                  ? 10
                                  : 30
                                : 'auto',
                              backgroundColor:
                                translatePerstepGrads2U1 &&
                                gpuIndex === 1 &&
                                showTemporaryGlowU1Gpu0
                                  ? 'rgba(255, 200, 200, 1)'
                                  : 'white'
                            }}
                          >
                            <span className="text-xs absolute top-1/2 left-1/2 
                              -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-center"
                            >
                              {shrinkPerstepGradsU1 ? (
                                <>
                                  Micro-grads
                                  <br />
                                  (shard)
                                </>
                              ) : (
                                <>
                                  Micro-grads
                                </>
                              )}
                            </span>
                          </div>
                        </>
                      )}

                      {/* ============================ */}
                      {/* Per-step grads for Unit0    */}
                      {/* ============================ */}
                      {unitIndex === 0 && (
                        <>
                          {/* Per-step grads 1 (Unit0) */}
                          <div
                            className="absolute border-2 border-solid border-black rounded-xl bg-white
                              transition-all duration-1000"
                            style={{
                              height: '25%',
                              width: shrinkPerstepGradsU0 ? '50%' : '100%',
                              top: '-25%',
                              left: 0,
                              opacity:
                                gpuIndex === 1 && hideGpu1Perstep1U0
                                  ? 0
                                  : showPerstepGradsU0
                                  ? 1
                                  : 0,
                              transform:
                                translatePerstepGrads1U0 && gpuIndex === 1
                                  ? 'translateY(-320px) scale(0.9)'
                                  : finalTranslatePerstepU0 && gpuIndex === 0
                                  ? 'translateY(80px) scale(0.9)'
                                  : 'none',
                              zIndex: translatePerstepGrads1U0
                                ? gpuIndex === 1
                                  ? 10
                                  : 30
                                : 'auto',
                              backgroundColor:
                                translatePerstepGrads1U0 &&
                                gpuIndex === 0 &&
                                showTemporaryGlowU0Gpu1
                                  ? 'rgba(255, 200, 200, 1)'
                                  : 'white'
                            }}
                          >
                            <span className="text-xs absolute top-1/2 left-1/2 
                              -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-center"
                            >
                              {shrinkPerstepGradsU0 ? (
                                <>
                                  Micro-grads
                                  <br />
                                  (shard)
                                </>
                              ) : (
                                <>
                                  Micro-grads
                                </>
                              )}
                            </span>
                          </div>

                          {/* Per-step grads 2 (Unit0) */}
                          <div
                            className="absolute border-2 border-solid border-black rounded-xl bg-white
                              transition-all duration-1000"
                            style={{
                              height: '25%',
                              width: shrinkPerstepGradsU0 ? '50%' : '100%',
                              top: '-25%',
                              right: 0,
                              opacity:
                                gpuIndex === 0 && hideGpu0Perstep2U0
                                  ? 0
                                  : showPerstepGradsU0
                                  ? 1
                                  : 0,
                              transform:
                                translatePerstepGrads2U0 && gpuIndex === 0
                                  ? 'translateY(320px) scale(0.9)'
                                  : finalTranslatePerstepU0 && gpuIndex === 1
                                  ? 'translateY(80px) scale(0.9)'
                                  : 'none',
                              zIndex: translatePerstepGrads2U0
                                ? gpuIndex === 0
                                  ? 10
                                  : 30
                                : 'auto',
                              backgroundColor:
                                translatePerstepGrads2U0 &&
                                gpuIndex === 1 &&
                                showTemporaryGlowU0Gpu0
                                  ? 'rgba(255, 200, 200, 1)'
                                  : 'white'
                            }}
                          >
                            <span className="text-xs absolute top-1/2 left-1/2 
                              -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-center"
                            >
                              {shrinkPerstepGradsU0 ? (
                                <>
                                  Micro-grads
                                  <br />
                                  (shard)
                                </>
                              ) : (
                                <>
                                  Micro-grads
                                </>
                              )}
                            </span>
                          </div>
                        </>
                      )}

                      {/* Label under each Unit */}
                      <div
                        className={`absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-sm
                          transition-opacity duration-500 
                          ${showInternalStructure ? 'opacity-100' : 'opacity-0'}`}
                      >
                        Unit{unitIndex}
                      </div>

                      {/* Activations box */}
                      <div
                        className="absolute border-2 border-solid border-black rounded-xl bg-white
                          transition-all duration-500"
                        style={{
                          top: '25%',
                          height: 'calc(75%)',
                          width: '76px',
                          // Hide activation for Unit2, Unit1, or Unit0 if necessary
                          opacity:
                            (unitIndex === 2 && hideUnit2Activations) ||
                            (unitIndex === 1 && hideUnit1Activations) ||
                            (unitIndex === 0 && hideUnit0Activations)
                              ? 0
                              : showActivationsBox[unitIndex]
                              ? 1
                              : 0,
                          right: gpuIndex === 1 ? 'auto' : 0,
                          left: gpuIndex === 1 ? 0 : 'auto',
                          transition: 'opacity 1000ms ease-in-out'
                        }}
                      >
                        <span className="text-xs absolute top-1/2 left-1/2 
                          -translate-x-1/2 -translate-y-1/2 whitespace-nowrap"
                        >
                          Activations
                        </span>
                      </div>
            
                      {/* Dashed box containing the chevrons */}
                      <div
                        className={`absolute top-0 w-full border-2 border-dashed border-black rounded-xl
                          transition-all duration-[790ms]`}
                        style={{
                          height: showInternalStructure ? '25%' : '100%',
                          opacity: showInternalStructure ? 1 : 1
                        }}
                      >
                        {/* FIRST chevron set (Unit0) => Right-facing */}
                        {unitIndex === 0 && (
                          <div
                            className="absolute top-1/2 right-44 transform -translate-y-1/2"
                          >
                            <AnimatedChevrons
                              isVisible={showChevrons}
                              fadeOutIndex={chevronFadeOutIndex}
                              reverseFadeIn={false}
                              reverseArrowDir={false}
                              reversePulseOrder={false}
                            />
                          </div>
                        )}

                        {/* SECOND chevron set (Unit2) => Left-facing */}
                        {unitIndex === 2 && (
                          <div
                            className="absolute top-1/2 left-44 transform -translate-y-1/2"
                          >
                            <AnimatedChevrons
                              isVisible={showChevrons2}
                              fadeOutIndex={-1}
                              fadeOutIndexReverse={chevrons2FadeOutIndex}
                              reverseFadeIn={true}
                              reverseArrowDir={true}
                              reversePulseOrder={true}
                              color="text-red-300"
                            />
                          </div>
                        )}
                      </div>

                      {/* The "internal structure" box for Params, Grads, Opt states */}
                      <div
                        className={`absolute w-[76px] transition-all duration-500 ease-in-out flex flex-col
                          ${
                            (unitIndex === 0 && showHalvesUnit0) ||
                            (unitIndex === 1 && showHalvesUnit1) ||
                            (unitIndex === 2 && showHalvesUnit2)
                              ? 'opacity-100'
                              : 'opacity-0'
                          }`}
                        style={{
                          top: '50%',
                          marginTop: '-80px',
                          left: gpuIndex === 0 ? '0px' : 'auto',
                          right: gpuIndex === 1 ? '0px' : 'auto',
                          height: '160px',
                        }}
                      >
                        <div className="relative h-full w-full">
                          {/* Params section */}
                          <div
                            className="absolute border-2 border-solid border-black rounded-xl bg-white
                              transition-all duration-1000"
                            style={{
                              height: 'calc(25%)',
                              width:
                                (
                                  (expandParamsBox[unitIndex] && !shrinkParamsBox[unitIndex]) ||
                                  (unitIndex === 2 && expandUnit2ParamsFinal && !shrinkExpandedParams) ||
                                  (unitIndex === 1 && expandUnit1ParamsFinal && !shrinkExpandedParamsU1) ||
                                  (unitIndex === 0 && expandUnit0ParamsFinal && !shrinkExpandedParamsU0)
                                )
                                  ? '151px'
                                  : '100%',
                              left: gpuIndex === 1 ? 'auto' : '0',
                              right: gpuIndex === 1 ? '0' : 'auto',
                              transform: `translateY(${showInternalStructure ? '0' : '50%'})`,
                              opacity: showInternalStructure ? '1' : '0'
                            }}
                          >
                            <span className="text-xs absolute top-1/2 left-1/2
                              -translate-x-1/2 -translate-y-1/2"
                            >
                              Params
                            </span>
                          </div>

                          {/* Grads section */}
                          <div
                            className="absolute w-full border-2 border-solid border-black rounded-xl bg-white
                              transition-all duration-500"
                            style={{
                              top: '50%',
                              height: showInternalStructure ? 'calc(25%)' : '100%',
                              transform: `translate(0, ${
                                showInternalStructure ? '-100%' : '-50%'
                              })`,
                              // Raise zIndex if final translation is happening for that unit or if showInternalStructure is true
                              zIndex: (
                                (finalTranslatePerstep && unitIndex === 2) ||
                                (finalTranslatePerstepU1 && unitIndex === 1) ||
                                (finalTranslatePerstepU0 && unitIndex === 0)
                              )
                                ? 40
                                : showInternalStructure ? 2 : 'auto',
                              backgroundColor:
                                // Glow for Unit2
                                (finalTranslatePerstep && unitIndex === 2 && gpuIndex === 0 && showTemporaryGlowUnit2Grads)
                                  ? 'rgba(255, 200, 200, 1)'
                                : (finalTranslatePerstep && unitIndex === 2 && gpuIndex === 1 && showTemporaryGlowUnit2GradsGpu1)
                                  ? 'rgba(255, 200, 200, 1)'
                                // Glow for Unit1
                                : (finalTranslatePerstepU1 && unitIndex === 1 && gpuIndex === 0 && showTemporaryGlowUnit1GradsGpu0)
                                  ? 'rgba(255, 200, 200, 1)'
                                : (finalTranslatePerstepU1 && unitIndex === 1 && gpuIndex === 1 && showTemporaryGlowUnit1GradsGpu1)
                                  ? 'rgba(255, 200, 200, 1)'
                                // Glow for Unit0
                                : (finalTranslatePerstepU0 && unitIndex === 0 && gpuIndex === 0 && showTemporaryGlowUnit0GradsGpu0)
                                  ? 'rgba(255, 200, 200, 1)'
                                : (finalTranslatePerstepU0 && unitIndex === 0 && gpuIndex === 1 && showTemporaryGlowUnit0GradsGpu1)
                                  ? 'rgba(255, 200, 200, 1)'
                                : 'white'
                            }}
                          >
                            <span className="text-xs absolute top-1/2 left-1/2
                              -translate-x-1/2 -translate-y-1/2"
                            >
                              {showInternalStructure ? 'Grads' : (
                                <span className="text-sm">Unit{unitIndex}</span>
                              )}
                            </span>
                          </div>

                          {/* Optimizer states section */}
                          <div
                            className="absolute w-full border-2 border-solid border-black rounded-xl bg-white
                              transition-all duration-500"
                            style={{
                              height: '50%',
                              transform: `translateY(${showInternalStructure ? '100%' : '50%'})`,
                              opacity: showInternalStructure ? '1' : '0',
                              zIndex: 1
                            }}
                          >
                            <span className="text-xs absolute top-1/2 left-1/2
                              -translate-x-1/2 -translate-y-1/2 text-center"
                            >
                              Optimizer
                              <br />
                              states
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelSplitAnimation;