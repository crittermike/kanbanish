import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';

const CardTagPicker = React.memo(({
  position,
  onTagAdd,
  onTagRemove,
  currentTags = [],
  boardTags = [],
  onClose
}) => {
  const [inputValue, setInputValue] = useState('');
  const pickerRef = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target) && !e.target.closest('.tag-action')) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleAddTag = (e) => {
    e.preventDefault();
    const newTag = inputValue.trim();
    if (newTag && newTag.length <= 20 && !currentTags.includes(newTag)) {
      onTagAdd(newTag);
      setInputValue('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAddTag(e);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const toggleTag = (tag) => {
    if (currentTags.includes(tag)) {
      onTagRemove(tag);
    } else {
      onTagAdd(tag);
    }
  };

  const filteredBoardTags = useMemo(() => {
    if (!inputValue.trim()) return boardTags;
    const lowerInput = inputValue.toLowerCase().trim();
    return boardTags.filter(tag => tag.toLowerCase().includes(lowerInput));
  }, [boardTags, inputValue]);

  return ReactDOM.createPortal(
    <div
      className="card-tag-picker"
      ref={pickerRef}
      style={{
        top: position.top,
        left: position.left
      }}
      onClick={e => e.stopPropagation()}
    >
      <input
        type="text"
        className="tag-picker-input"
        placeholder="Add a tag..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value.slice(0, 20))}
        onKeyDown={handleKeyDown}
        autoFocus
        maxLength={20}
      />
      <div className="tag-picker-tags">
        {filteredBoardTags.map(tag => (
          <button
            key={tag}
            className={`tag-picker-tag ${currentTags.includes(tag) ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleTag(tag);
            }}
          >
            {tag}
          </button>
        ))}
        {filteredBoardTags.length === 0 && !inputValue.trim() && (
          <div className="tag-picker-empty">No existing tags. Type to create one!</div>
        )}
      </div>
    </div>,
    document.body
  );
});

export default CardTagPicker;
