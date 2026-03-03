import { useState } from 'react';
import { Check, X, Image as ImageIcon } from 'react-feather';
import BOARD_BACKGROUNDS, { BACKGROUND_CATEGORIES } from '../data/boardBackgrounds';

/**
 * Background picker component for the Settings panel Appearance tab.
 * Shows a grid of background thumbnails organized by category tabs.
 *
 * @param {Object} props
 * @param {string} props.currentBackgroundId - Currently selected background ID
 * @param {Function} props.onSelectBackground - Callback when a background is selected
 */
const BackgroundPicker = ({ 
  currentBackgroundId, 
  onSelectBackground, 
  customBackgroundCss, 
  onSetCustomBackground,
  customBackgroundSize = 'cover',
  onSetCustomBackgroundSize
}) => {
  const [activeCategory, setActiveCategory] = useState('solid');
  const [customUrl, setCustomUrl] = useState('');

  const backgrounds = BOARD_BACKGROUNDS.filter(bg => bg.category === activeCategory);

  return (
    <div className="background-picker">
      <h4 className="settings-section-title">Board Background</h4>

      {/* Category tabs */}
      <div className="bg-picker-categories" role="tablist" aria-label="Background categories">
        {BACKGROUND_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            role="tab"
            aria-selected={activeCategory === cat.id}
            className={`bg-picker-category-tab${activeCategory === cat.id ? ' bg-picker-category-tab-active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Custom URL Section or Background grid */}
      {activeCategory === 'custom' ? (
        <div className="bg-picker-custom" role="tabpanel" aria-label="Custom background">
          <div className="bg-picker-custom-input-group">
            <input
              type="url"
              className="bg-picker-custom-input"
              placeholder="Paste image URL..."
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
            />
            <button
              className="bg-picker-custom-apply btn"
              disabled={!customUrl.trim()}
              onClick={() => {
                if (customUrl.trim()) {
                  onSetCustomBackground(`url(${customUrl.trim()})`);
                  setCustomUrl('');
                }
              }}
            >
              Apply
            </button>
          </div>
          <p className="settings-hint bg-picker-custom-hint">Paste any public image URL</p>

          {currentBackgroundId === 'custom' && customBackgroundCss && (
            <div className="bg-picker-size-section">
              <h5 className="bg-picker-size-title">Image sizing</h5>
              <div className="bg-picker-size-toggle">
                <button
                  className={`bg-picker-size-option ${customBackgroundSize === 'tile' ? 'selected' : ''}`}
                  onClick={() => onSetCustomBackgroundSize('tile')}
                  title="Repeat pattern"
                >
                  Tile
                </button>
                <button
                  className={`bg-picker-size-option ${customBackgroundSize === 'cover' ? 'selected' : ''}`}
                  onClick={() => onSetCustomBackgroundSize('cover')}
                  title="Fill, may crop"
                >
                  Cover
                </button>
                <button
                  className={`bg-picker-size-option ${customBackgroundSize === 'stretch' ? 'selected' : ''}`}
                  onClick={() => onSetCustomBackgroundSize('stretch')}
                  title="Fill, may warp"
                >
                  Stretch
                </button>
              </div>
            </div>
          )}

          <div className="bg-picker-custom-preview-area">
            {currentBackgroundId === 'custom' && customBackgroundCss ? (
              <>
                <div 
                  className="bg-picker-custom-preview-image" 
                  style={{ 
                    background: customBackgroundCss, 
                    backgroundSize: customBackgroundSize === 'tile' ? 'auto' : customBackgroundSize === 'stretch' ? '100% 100%' : 'cover',
                    backgroundRepeat: customBackgroundSize === 'tile' ? 'repeat' : 'no-repeat',
                    backgroundPosition: customBackgroundSize === 'tile' ? 'top left' : 'center'
                  }}
                />
                <button
                  className="bg-picker-custom-clear btn"
                  onClick={() => onSelectBackground('none')}
                >
                  Clear Custom Background
                </button>
              </>
            ) : (
              <div className="bg-picker-custom-preview-empty">
                <ImageIcon size={24} aria-hidden="true" />
                <span>No custom background</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          className="bg-picker-grid"
          role="tabpanel"
          aria-label={`${BACKGROUND_CATEGORIES.find(c => c.id === activeCategory)?.label || ''} backgrounds`}
        >
          {backgrounds.map(bg => {
            const isSelected = currentBackgroundId === bg.id;
            const isNone = bg.id === 'none';

            return (
              <button
                key={bg.id}
                className={`bg-picker-swatch${isSelected ? ' bg-picker-swatch-selected' : ''}`}
                onClick={() => onSelectBackground(bg.id)}
                title={bg.name}
                aria-label={`${bg.name}${isSelected ? ' (selected)' : ''}`}
                aria-pressed={isSelected}
              >
                <span
                  className="bg-picker-swatch-preview"
                  style={isNone ? {} : { background: bg.css }}
                >
                  {isNone && (
                    <span className="bg-picker-swatch-none">
                      <X size={14} aria-hidden="true" />
                    </span>
                  )}
                </span>

                {/* Selected check */}
                {isSelected && (
                  <span className="bg-picker-swatch-check" aria-hidden="true">
                    <Check size={12} />
                  </span>
                )}

                <span className="bg-picker-swatch-name">{bg.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BackgroundPicker;
