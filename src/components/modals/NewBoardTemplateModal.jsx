import { useEffect, useMemo, useRef, useState } from 'react';
import BOARD_TEMPLATES from '../../data/boardTemplates';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import TemplateLink from '../TemplateLink';
import '../../styles/components/modals.css';
import '../../styles/components/template-select.css';

const getColumnTitle = column => (typeof column === 'string' ? column : column.title);

/**
 * Safely highlights matching text by splitting into segments and wrapping
 * matches in <mark> elements. Avoids dangerouslySetInnerHTML / XSS risk.
 *
 * @param {string} text - The text to highlight within
 * @param {string} query - The search query to highlight
 * @returns {React.ReactNode} Text with highlighted matches, or plain string if no query
 */
const highlightMatch = (text, query) => {
  if (!query.trim()) {
    return text;
  }

  try {
    const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);

    if (parts.length === 1) {
      return text;
    }

    return parts.map((part, i) =>
      regex.test(part)
        ? <mark key={i}>{part}</mark>
        : part
    );
  } catch {
    return text;
  }
};

/**
 * Full template picker behind the dashboard's "More…" chip.
 * Clicking a template creates the board immediately.
 */
const NewBoardTemplateModal = ({ isOpen, onClose, onSelectTemplate, disabled = false }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const modalRef = useRef(null);
  const searchInputRef = useRef(null);

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  useFocusTrap(modalRef, isOpen, { onClose: handleClose });

  // Runs after useFocusTrap's initial focus so the search box wins
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => searchInputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [isOpen]);

  const filteredTemplates = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      return BOARD_TEMPLATES;
    }
    return BOARD_TEMPLATES.filter(template =>
      template.name.toLowerCase().includes(query) ||
      template.description.toLowerCase().includes(query) ||
      template.tags.some(tag => tag.toLowerCase().includes(query)) ||
      template.columns.some(column => getColumnTitle(column).toLowerCase().includes(query))
    );
  }, [searchQuery]);

  const handleSearchKeyDown = e => {
    if (e.key === 'Enter' && filteredTemplates.length > 0) {
      e.preventDefault();
      if (!disabled) {
        onSelectTemplate(filteredTemplates[0]);
      }
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" role="presentation">
      <div ref={modalRef} className="modal-container template-modal" role="dialog" aria-modal="true" aria-labelledby="template-modal-title">
        <div className="modal-header">
          <h2 id="template-modal-title">Templates</h2>
          <button className="close-button" onClick={handleClose} aria-label="Close">&times;</button>
        </div>

        <div className="modal-body template-selector">
          <input
            type="search"
            placeholder="Search templates"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="template-search-input"
            aria-label="Search templates"
            ref={searchInputRef}
          />

          {filteredTemplates.length === 0 ? (
            <div className="no-results">No matches</div>
          ) : (
            <div className="template-grid">
              {filteredTemplates.map(template => {
                const columns = template.columns.map(getColumnTitle).join(' · ');
                return (
                  <TemplateLink
                    key={template.id}
                    template={template}
                    onSelect={onSelectTemplate}
                    disabled={disabled}
                    className="template-card"
                    title={template.description}
                  >
                    <span className="template-icon" aria-hidden="true">{template.icon}</span>
                    <span className="template-info">
                      <span className="template-name">{highlightMatch(template.name, searchQuery)}</span>
                      <span className="template-columns">{highlightMatch(columns, searchQuery)}</span>
                    </span>
                  </TemplateLink>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewBoardTemplateModal;
