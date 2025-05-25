import React, { useEffect, useRef, useState } from 'react';

const GatherUpdate = () => {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [contentHeight, setContentHeight] = useState(0);
  
  const boxes = Array.from({ length: 26 }, (_, i) => i);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current && contentRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const contentWidth = contentRef.current.scrollWidth;
        const newScale = Math.min(1, (containerWidth - 32) / contentWidth); // 32px for padding
        setScale(newScale);
        
        // Use setTimeout to ensure height is measured after render
        setTimeout(() => {
          if (contentRef.current) {
            const originalHeight = contentRef.current.scrollHeight;
            setContentHeight(originalHeight);
          }
        }, 0);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="w-full flex items-start justify-center p-4" //border-4 border-red-500 
      style={{ 
        backgroundColor: '#fdfdfd',
        height: contentHeight ? `${contentHeight * scale + 32}px` : 'auto' // 32px for padding
      }}
    >
      <div 
        ref={contentRef}
        className="flex flex-col items-center"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center top',
          width: 'max-content'
        }}
      >
        <span className="mb-2 text-lg font-medium">Flat Parameter: (1,26)</span>
        <div className="relative flex gap-1 p-1.5 mb-40">
          <div className="absolute inset-0 border-2 border-solid border-gray-800 rounded-xl" />
          {boxes.map((num) => (
            <div
              key={num}
              className={`flex items-center justify-center w-10 h-8 border-2 border-solid 
                         ${num === 25 ? 'border-red-500' : 'border-gray-800'} rounded-lg bg-white text-sm`}
            >
              <span className="font-semibold">{num}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-40">
          <div className="flex flex-col items-center">
            <span className="mb-2 text-lg font-medium">Parameter A: (2,3)</span>
            <div className="relative flex flex-col gap-1 p-1.5">
              <div className="absolute inset-0 border-2 border-solid border-blue-500 rounded-xl" />
              <div className="flex gap-1">
                {Array.from({ length: 3 }, (_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-center w-10 h-8 border-2 border-solid border-blue-500 rounded-lg bg-white text-sm"
                  >
                    <span className="font-semibold">{i}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-1">
                {Array.from({ length: 3 }, (_, i) => (
                  <div
                    key={i + 3}
                    className="flex items-center justify-center w-10 h-8 border-2 border-solid border-blue-500 rounded-lg bg-white text-sm"
                  >
                    <span className="font-semibold">{i + 3}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <span className="mb-2 text-lg font-medium">Parameter B: (1,5)</span>
            <div className="relative flex gap-1 p-1.5">
              <div className="absolute inset-0 border-2 border-solid border-blue-500 rounded-xl" />
              {Array.from({ length: 5 }, (_, i) => (
                <div
                  key={i + 6}
                  className="flex items-center justify-center w-10 h-8 border-2 border-solid border-blue-500 rounded-lg bg-white text-sm"
                >
                  <span className="font-semibold">{i + 6}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center">
            <span className="mb-2 text-lg font-medium">Parameter C: (7,2)</span>
            <div className="relative flex flex-col gap-1 p-1.5">
              <div className="absolute inset-0 border-2 border-solid border-blue-500 rounded-xl" />
              {Array.from({ length: 7 }, (_, rowIndex) => (
                <div key={rowIndex} className="flex gap-1">
                  {Array.from({ length: 2 }, (_, colIndex) => {
                    const num = 11 + (rowIndex * 2) + colIndex;
                    return (
                      <div
                        key={num}
                        className="flex items-center justify-center w-10 h-8 border-2 border-solid border-blue-500 rounded-lg bg-white text-sm"
                      >
                        <span className="font-semibold">{num}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GatherUpdate;