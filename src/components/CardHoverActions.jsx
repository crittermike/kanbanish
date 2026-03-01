import React, { useRef, useState } from 'react';
import { MessageSquare, Smile, Droplet, Tag, CheckSquare } from 'react-feather';
import {
  shouldUseDisabledStyling,
  shouldHideFeature,
  getReactionDisabledMessage
} from '../utils/retrospectiveModeUtils';
import CardColorPicker from './CardColorPicker';
import CardTagPicker from './CardTagPicker';
import EmojiPicker from './EmojiPicker';

const CardHoverActions = React.memo(({
  showEmojiPicker,
  setShowEmojiPicker,
  setShowComments,
  toggleComments,
  setEmojiPickerPosition,
  emojiPickerPosition,
  addReaction,
  hasUserReactedWithEmoji,
  commentCount = 0,
  disabled = false,
  disabledReason = 'cards-not-revealed',
  onColorSelect,
  onTagAdd,
  onTagRemove,
  currentColor,
  currentTags,
  boardTags,
  onConvertToActionItem,
  hasActionItem
}) => {
  const emojiButtonRef = useRef(null);
  const colorButtonRef = useRef(null);
  const tagButtonRef = useRef(null);

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [colorPickerPosition, setColorPickerPosition] = useState({ top: 0, left: 0 });
  const [tagPickerPosition, setTagPickerPosition] = useState({ top: 0, left: 0 });

  // Use utility functions for consistent logic
  const useDisabledStyling = shouldUseDisabledStyling(disabled, disabledReason);
  const hideAddButton = shouldHideFeature(disabledReason);

  return (
    <div className="card-hover-actions">
      {showEmojiPicker && (
        <EmojiPicker
          position={emojiPickerPosition}
          onEmojiSelect={addReaction}
          onClose={() => setShowEmojiPicker(false)}
          hasUserReactedWithEmoji={hasUserReactedWithEmoji}
        />
      )}
      {showColorPicker && (
        <CardColorPicker
          position={colorPickerPosition}
          onColorSelect={onColorSelect}
          onClose={() => setShowColorPicker(false)}
          currentColor={currentColor}
        />
      )}
      {showTagPicker && (
        <CardTagPicker
          position={tagPickerPosition}
          onTagAdd={onTagAdd}
          onTagRemove={onTagRemove}
          currentTags={currentTags}
          boardTags={boardTags}
          onClose={() => setShowTagPicker(false)}
        />
      )}
      {!hideAddButton && (
        <>
          <button
            className={`card-hover-action color-action ${useDisabledStyling ? 'disabled' : ''}`}
            onClick={disabled ? undefined : e => {
              e.stopPropagation();
              if (colorButtonRef.current) {
                const buttonRect = colorButtonRef.current.getBoundingClientRect();
                setColorPickerPosition({
                  top: buttonRect.bottom + window.scrollY + 5,
                  left: buttonRect.left + window.scrollX
                });
              }
              setShowColorPicker(!showColorPicker);
              setShowEmojiPicker(false);
              setShowTagPicker(false);
              setShowComments(false);
            }}
            title={disabled ? getReactionDisabledMessage(disabledReason) : 'Set color'}
            aria-label="Set color"
            ref={colorButtonRef}
            disabled={useDisabledStyling}
          >
            <Droplet size={16} aria-hidden="true" />
          </button>
          <button
            className={`card-hover-action tag-action ${useDisabledStyling ? 'disabled' : ''}`}
            onClick={disabled ? undefined : e => {
              e.stopPropagation();
              if (tagButtonRef.current) {
                const buttonRect = tagButtonRef.current.getBoundingClientRect();
                setTagPickerPosition({
                  top: buttonRect.bottom + window.scrollY + 5,
                  left: buttonRect.left + window.scrollX
                });
              }
              setShowTagPicker(!showTagPicker);
              setShowEmojiPicker(false);
              setShowColorPicker(false);
              setShowComments(false);
            }}
            title={disabled ? getReactionDisabledMessage(disabledReason) : 'Add tags'}
            aria-label="Add tags"
            ref={tagButtonRef}
            disabled={useDisabledStyling}
          >
            <Tag size={16} aria-hidden="true" />
          </button>
          <button
            className={`card-hover-action emoji-action ${useDisabledStyling ? 'disabled' : ''}`}
            onClick={disabled ? undefined : e => {
              e.stopPropagation();
              if (emojiButtonRef.current) {
                const buttonRect = emojiButtonRef.current.getBoundingClientRect();
                setEmojiPickerPosition({
                  top: buttonRect.bottom + window.scrollY + 5,
                  left: buttonRect.left + window.scrollX
                });
              }
              setShowEmojiPicker(!showEmojiPicker);
              setShowColorPicker(false);
              setShowTagPicker(false);
              setShowComments(false);
            }}
            title={disabled ? getReactionDisabledMessage(disabledReason) : 'Add reaction'}
            aria-label="Add reaction"
            ref={emojiButtonRef}
            disabled={useDisabledStyling}
          >
            <Smile size={16} aria-hidden="true" />
          </button>
        </>
      )}
      
      {!hideAddButton && !hasActionItem && onConvertToActionItem && (
        <button
          className={`card-hover-action action-item-action ${useDisabledStyling ? 'disabled' : ''}`}
          onClick={disabled ? undefined : e => {
            e.stopPropagation();
            onConvertToActionItem();
          }}
          title={disabled ? getReactionDisabledMessage(disabledReason) : 'Convert to action item'}
          aria-label="Convert to action item"
          disabled={useDisabledStyling}
        >
          <CheckSquare size={16} aria-hidden="true" />
        </button>
      )}
      {hasActionItem && (
        <span className="card-hover-action action-item-indicator" title="Has action item">
          <CheckSquare size={16} aria-hidden="true" />
        </span>
      )}

      {/* Show comment button on hover only */}
      <button
        className={`card-hover-action comment-action ${commentCount > 0 ? 'has-comments' : ''}`}
        onClick={e => {
          e.stopPropagation();
          toggleComments();
        }}
        title="Toggle comments"
        aria-label={commentCount > 0 ? `Toggle comments (${commentCount})` : 'Toggle comments'}
      >
        <MessageSquare size={16} aria-hidden="true" />
        {commentCount > 0 && <span className="comment-count">{commentCount}</span>}
      </button>
    </div>
  );
});

export default CardHoverActions;
