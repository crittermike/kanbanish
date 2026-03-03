import { useState } from 'react';
import { Check, Lock, X } from 'react-feather';
import BOARD_BACKGROUNDS, { BACKGROUND_CATEGORIES } from '../data/boardBackgrounds';

/**
 * Background picker component for the Settings panel Appearance tab.
 * Shows a grid of background thumbnails organized by category tabs.
 * Pro backgrounds show a lock icon overlay and upgrade prompt on click.
 *
 * @param {Object} props
 * @param {string} props.currentBackgroundId - Currently selected background ID
 * @param {Function} props.onSelectBackground - Callback when a background is selected
 */
const BackgroundPicker = ({ currentBackgroundId, onSelectBackground }) => {
  const [activeCategory, setActiveCategory] = useState('solid');
  const [showProPrompt, setShowProPrompt] = useState(false);
  const [selectedProBg, setSelectedProBg] = useState(null);

  const backgrounds = BOARD_BACKGROUNDS.filter(bg => bg.category === activeCategory);

  const handleBackgroundClick = (bg) => {
    if (bg.isPro) {
      setSelectedProBg(bg);
      setShowProPrompt(true);
      return;
    }
    onSelectBackground(bg.id);
  };

  const handleProDismiss = () => {
    setShowProPrompt(false);
    setSelectedProBg(null);
  };

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

      {/* Background grid */}
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
              className={`bg-picker-swatch${isSelected ? ' bg-picker-swatch-selected' : ''}${bg.isPro ? ' bg-picker-swatch-pro' : ''}`}
              onClick={() => handleBackgroundClick(bg)}
              title={bg.isPro ? `${bg.name} (Pro)` : bg.name}
              aria-label={`${bg.name}${bg.isPro ? ' (Pro)' : ''}${isSelected ? ' (selected)' : ''}`}
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

              {/* Pro badge */}
              {bg.isPro && !isSelected && (
                <span className="bg-picker-swatch-lock" aria-hidden="true">
                  <Lock size={10} />
                </span>
              )}

              <span className="bg-picker-swatch-name">{bg.name}</span>
            </button>
          );
        })}
      </div>

      {/* Pro upgrade prompt */}
      {showProPrompt && selectedProBg && (
        <div className="bg-picker-pro-prompt">
          <div className="bg-picker-pro-prompt-preview" style={{ background: selectedProBg.css }} />
          <div className="bg-picker-pro-prompt-content">
            <p className="bg-picker-pro-prompt-title">
              <Lock size={12} aria-hidden="true" />
              Unlock &ldquo;{selectedProBg.name}&rdquo;
            </p>
            <p className="bg-picker-pro-prompt-desc">
              Premium backgrounds are available with Kanbanish Pro. Upgrade to customize your board with beautiful themes.
            </p>
            <div className="bg-picker-pro-prompt-actions">
              <button className="bg-picker-pro-upgrade-btn" onClick={handleProDismiss}>
                Learn More
              </button>
              <button className="bg-picker-pro-dismiss-btn" onClick={handleProDismiss}>
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackgroundPicker;
