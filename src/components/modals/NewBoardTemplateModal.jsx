import React, { useState, useEffect } from 'react';
import BOARD_TEMPLATES from '../../data/boardTemplates';
import '../../styles/components/modals.css';
import '../../styles/components/template-select.css';

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
    // Escape special regex characters in the query
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

const NewBoardTemplateModal = ({ isOpen, onClose, onSelectTemplate }) => {
  const [selectedTemplate, setSelectedTemplate] = useState('default');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTemplates, setFilteredTemplates] = useState(BOARD_TEMPLATES);

  // Filter templates based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTemplates(BOARD_TEMPLATES);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = BOARD_TEMPLATES.filter(template =>
      template.name.toLowerCase().includes(query) ||
      template.description.toLowerCase().includes(query) ||
      template.tags.some(tag => tag.toLowerCase().includes(query)) ||
      template.columns.some(column => column.toLowerCase().includes(query))
    );

    setFilteredTemplates(filtered);
  }, [searchQuery]);

  const handleTemplateSelect = templateId => {
    setSelectedTemplate(templateId);
  };

  const handleConfirm = () => {
    const template = BOARD_TEMPLATES.find(t => t.id === selectedTemplate);
    if (template) {
      onSelectTemplate(template.columns, template.name);
    }
  };

  const handleSearchChange = e => {
    setSearchQuery(e.target.value);
  };

  const searchInputRef = React.useRef(null);
  const createButtonRef = React.useRef(null);

  // Enhanced keyboard navigation
  const handleKeyDown = e => {
    if (e.key === 'Enter' && e.target.classList.contains('template-search-input')) {
      if (filteredTemplates.length > 0) {
        setSelectedTemplate(filteredTemplates[0].id);
        e.preventDefault();
      }
    } else if (e.key === 'Enter' && !e.target.classList.contains('template-search-input')) {
      handleConfirm();
      e.preventDefault();
    } else if (e.key === 'Escape') {
      if (searchQuery) {
        setSearchQuery('');
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
        e.preventDefault();
      } else {
        onClose();
      }
    } else if (e.key === '/' && !e.target.classList.contains('template-search-input')) {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
        e.preventDefault();
      }
    }
  };

  // Focus the search input when the modal opens
  React.useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current.focus();
      }, 100);
    }
  }, [isOpen]);

  // Add key event listener when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, selectedTemplate, searchQuery, filteredTemplates]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-container template-modal">
        <div className="modal-header">
          <h2>Choose a Board Template</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body template-selector">
          <div className="template-search">
            <div className="search-input-container">
              <input
                type="text"
                placeholder="Search templates by name, description, or columns... (Press / to focus)"
                value={searchQuery}
                onChange={handleSearchChange}
                className="template-search-input"
                autoFocus
                ref={searchInputRef}
              />
              {searchQuery && (
                <button
                  className="clear-search"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            <div className="search-results-count">
              {searchQuery ? (
                filteredTemplates.length === 0 ? (
                  <div className="no-results">
                    No templates match your search
                  </div>
                ) : (
                  <div className="results-count">
                    Found {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
                  </div>
                )
              ) : null}
            </div>
          </div>

          <div className="template-grid">
            {filteredTemplates.map(template => (
              <div
                key={template.id}
                className={`template-card ${selectedTemplate === template.id ? 'selected' : ''} ${searchQuery ? 'search-active' : ''}`}
                onClick={() => handleTemplateSelect(template.id)}
              >
                <div className="template-icon">{template.icon}</div>
                <div className="template-info">
                  <h3>{highlightMatch(template.name, searchQuery)}</h3>
                  <p>{highlightMatch(template.description, searchQuery)}</p>
                </div>
                <div className="template-details">
                  <div className="template-columns">
                    {template.columns.map((col, idx) => (
                      <span key={idx} className="template-column-pill">
                        {highlightMatch(col, searchQuery)}
                      </span>
                    ))}
                  </div>
                  <div className="template-tags">
                    {template.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className={`template-tag ${searchQuery && tag.toLowerCase().includes(searchQuery.toLowerCase()) ? 'highlight' : ''}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="primary-button"
            onClick={handleConfirm}
            ref={createButtonRef}
          >
            Create Board
          </button>
          <button
            className="secondary-button"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewBoardTemplateModal;
