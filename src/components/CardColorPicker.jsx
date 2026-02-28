import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, Check } from 'react-feather';

const CARD_COLORS = [
  '#f85149', // red
  '#db6d28', // orange
  '#d29922', // yellow
  '#2ea043', // green
  '#58a6ff', // blue
  '#8b5cf6', // purple
  '#f472b6', // pink
  '#6b7280', // gray
];

const CardColorPicker = React.memo(({
  position,
  onColorSelect,
  onClose,
  currentColor
}) => {
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      // Check if click is outside picker and not on the color button itself
      if (pickerRef.current && !pickerRef.current.contains(e.target) && !e.target.closest('.color-action')) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return ReactDOM.createPortal(
    <div
      className="card-color-picker"
      ref={pickerRef}
      style={{
        top: position.top,
        left: position.left
      }}
      onClick={e => e.stopPropagation()}
    >
      <button
        className={`color-option no-color ${!currentColor ? 'selected' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onColorSelect(null);
          onClose();
        }}
        title="No color"
        aria-label="No color"
      >
        <X size={14} />
      </button>
      {CARD_COLORS.map(color => (
        <button
          key={color}
          className={`color-option ${currentColor === color ? 'selected' : ''}`}
          style={{ backgroundColor: color }}
          onClick={(e) => {
            e.stopPropagation();
            onColorSelect(color);
            onClose();
          }}
          title={color}
          aria-label={`Select color ${color}`}
        >
          {currentColor === color && <Check size={14} color="#fff" />}
        </button>
      ))}
    </div>,
    document.body
  );
});

export default CardColorPicker;
