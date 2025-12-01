import React, { useState, useRef, useEffect } from 'react';
import './Tooltip.css';

const Tooltip = ({ text, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [positionClass, setPositionClass] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    if (isVisible && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const screenWidth = window.innerWidth;

      // 如果图标的右边缘距离屏幕右边缘小于 200px，则向左对齐
      if (screenWidth - rect.right < 200) {
        setPositionClass('align-left');
      } else {
        setPositionClass('');
      }
    }
  }, [isVisible]);

  return (
    <span
      ref={containerRef}
      className="tooltip-container"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <span className={`tooltip-box ${positionClass}`}>{text}</span>
      )}
    </span>
  );
};

export default Tooltip;
