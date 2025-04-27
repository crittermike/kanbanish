// filepath: /Users/crittermike/Code/kanbanish/src/components/modals/NewBoardTemplateModal.jsx
import React, { useState, useEffect } from 'react';
import '../../styles/components/modals.css';
import '../../styles/components/template-select.css';

// Define board templates
const BOARD_TEMPLATES = [
  {
    id: 'default',
    name: 'Default',
    description: 'Simple task tracking for any project',
    columns: ['To Do', 'In Progress', 'Done'],
    icon: '📋',
    tags: ['workflow', 'kanban', 'basic']
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Create your own board structure from scratch',
    columns: ['Untitled'],
    icon: '✏️',
    tags: ['custom', 'blank', 'flexible']
  },
  {
    id: 'lean-coffee',
    name: 'Lean Coffee',
    description: 'Democratically driven meeting agenda format',
    columns: ['Topics', 'Discussing', 'Done'],
    icon: '☕',
    tags: ['discussion', 'meeting', 'agenda']
  },
  {
    id: 'retro',
    name: 'Retrospective',
    description: 'Reflect on past work and plan improvements',
    columns: ['Went Well', 'Could Improve', 'Action Items'],
    icon: '🔄',
    tags: ['agile', 'reflection', 'team']
  },
  {
    id: 'feelings-improvements',
    name: 'Feelings / Improvements',
    description: 'Focus on emotional impact and concrete solutions',
    columns: ['Feelings', 'Improvements'],
    icon: '❤️',
    tags: ['feedback', 'emotions', 'solutions']
  },
  {
    id: 'daki',
    name: 'DAKI',
    description: 'Evaluate current processes and identify changes',
    columns: ['Drop', 'Add', 'Keep', 'Improve'],
    icon: '✨',
    tags: ['reflection', 'processes', 'practices']
  },
  {
    id: 'glad-sad-mad',
    name: 'Glad Sad Mad',
    description: 'Categorize feedback by emotional response',
    columns: ['Glad', 'Sad', 'Mad'],
    icon: '😊',
    tags: ['emotions', 'reflection', 'feedback']
  },
  {
    id: 'start-stop-continue',
    name: 'Start Stop Continue',
    description: 'Focus on actionable changes to team behavior',
    columns: ['Start', 'Stop', 'Continue'],
    icon: '🚦',
    tags: ['action', 'feedback', 'improvement']
  },
  {
    id: '4ls',
    name: '4 Ls',
    description: 'Comprehensive retrospective with learning focus',
    columns: ['Liked', 'Learned', 'Lacked', 'Longed For'],
    icon: '📝',
    tags: ['reflection', 'learning', 'retrospective']
  },
  {
    id: 'swot',
    name: 'SWOT',
    description: 'Analyze internal and external factors for planning',
    columns: ['Strengths', 'Weaknesses', 'Opportunities', 'Threats'],
    icon: '📊',
    tags: ['strategy', 'planning', 'analysis']
  },
  // Additional templates
  {
    id: 'six-thinking-hats',
    name: 'Six Thinking Hats',
    description: 'Examine ideas from multiple mental perspectives',
    columns: ['Facts', 'Emotions', 'Critical', 'Optimistic', 'Creative', 'Process'],
    icon: '🎩',
    tags: ['thinking', 'perspectives', 'discussion']
  },
  {
    id: 'moscow',
    name: 'MoSCoW',
    description: 'Categorize features by implementation priority',
    columns: ['Must Have', 'Should Have', 'Could Have', 'Won\'t Have'],
    icon: '📌',
    tags: ['prioritization', 'planning', 'requirements']
  },
  {
    id: 'five-whys',
    name: 'Five Whys',
    description: 'Iteratively identify the underlying causes of issues',
    columns: ['Problem', 'Why 1', 'Why 2', 'Why 3', 'Why 4', 'Why 5', 'Root Cause'],
    icon: '🔍',
    tags: ['problem solving', 'analysis', 'causes']
  },
  {
    id: 'eisenhower',
    name: 'Eisenhower Matrix',
    description: 'Prioritize tasks based on urgency and importance',
    columns: ['Urgent & Important', 'Important & Not Urgent', 'Urgent & Not Important', 'Neither'],
    icon: '⏱️',
    tags: ['decision', 'prioritization', 'time management']
  },
  {
    id: 'sailboat',
    name: 'Sailboat Retrospective',
    description: 'Visualize team progress with nautical metaphors',
    columns: ['Wind (Helps)', 'Anchors (Hinders)', 'Rocks (Risks)', 'Island (Goals)'],
    icon: '⛵',
    tags: ['retrospective', 'visual', 'team']
  },
  {
    id: 'fishbone',
    name: 'Fishbone',
    description: 'Identify causes across different categories',
    columns: ['People', 'Process', 'Equipment', 'Materials', 'Environment', 'Management'],
    icon: '🐟',
    tags: ['analysis', 'causes', 'problem solving']
  },
  {
    id: 'feedback-grid',
    name: 'Feedback Grid',
    description: 'Balanced approach to feedback with action items',
    columns: ['What Went Well', 'What Could Be Improved', 'Questions', 'Ideas'],
    icon: '🔄',
    tags: ['feedback', 'collection', 'reflection']
  },
  {
    id: 'starfish',
    name: 'Starfish Retrospective',
    description: 'Detailed action-oriented team improvement model',
    columns: ['Keep Doing', 'Less Of', 'More Of', 'Start Doing', 'Stop Doing'],
    icon: '⭐',
    tags: ['retrospective', 'actions', 'team']
  },
  {
    id: 'kpt',
    name: 'KPT',
    description: 'Concise approach for identifying issues and solutions',
    columns: ['Keep', 'Problem', 'Try'],
    icon: '🔑',
    tags: ['retrospective', 'simple', 'actions']
  },
  {
    id: 'pro-con',
    name: 'Pros & Cons',
    description: 'Evaluate options and make informed decisions',
    columns: ['Pros', 'Cons', 'Decisions'],
    icon: '⚖️',
    tags: ['decision', 'evaluation', 'analysis']
  }
];

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
    // Keep searching in tags (for backend filtering) even though we don't display them
    const filtered = BOARD_TEMPLATES.filter(template => 
      template.name.toLowerCase().includes(query) || 
      template.description.toLowerCase().includes(query) ||
      template.tags.some(tag => tag.toLowerCase().includes(query)) ||
      template.columns.some(column => column.toLowerCase().includes(query))
    );
    
    setFilteredTemplates(filtered);
  }, [searchQuery]);

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
  };

  const handleConfirm = () => {
    const template = BOARD_TEMPLATES.find(t => t.id === selectedTemplate);
    if (template) {
      onSelectTemplate(template.columns, template.name);
    }
  };
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Create refs for the search input and create button
  const searchInputRef = React.useRef(null);
  const createButtonRef = React.useRef(null);
  
  // Enhanced keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.classList.contains('template-search-input')) {
      // If Enter pressed in search and we have results, select first one
      if (filteredTemplates.length > 0) {
        setSelectedTemplate(filteredTemplates[0].id);
        e.preventDefault();
      }
    } else if (e.key === 'Enter' && !e.target.classList.contains('template-search-input')) {
      handleConfirm();
      e.preventDefault();
    } else if (e.key === 'Escape') {
      // First clear search if active, otherwise close modal
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
      // Quick shortcut to focus the search box
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

  if (!isOpen) return null;

  // Function to highlight matching text
  const highlightMatch = (text, query) => {
    if (!query.trim()) return text;
    
    try {
      const regex = new RegExp(`(${query.trim()})`, 'gi');
      return text.replace(regex, '<mark>$1</mark>');
    } catch (e) {
      return text; // In case of invalid regex
    }
  };
  
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
            {filteredTemplates.map(template => {
              // Prepare highlighted content if we're searching
              const highlightedName = searchQuery ? 
                <span dangerouslySetInnerHTML={{ __html: highlightMatch(template.name, searchQuery) }} /> : 
                template.name;
              
              const highlightedDesc = searchQuery ? 
                <span dangerouslySetInnerHTML={{ __html: highlightMatch(template.description, searchQuery) }} /> : 
                template.description;
                
              return (
                <div 
                  key={template.id}
                  className={`template-card ${selectedTemplate === template.id ? 'selected' : ''} ${searchQuery ? 'search-active' : ''}`}
                  onClick={() => handleTemplateSelect(template.id)}
                >
                  <div className="template-icon">{template.icon}</div>
                  <div className="template-info">
                    <h3>{highlightedName}</h3>
                    <p>{highlightedDesc}</p>
                  </div>
                  <div className="template-details">
                    <div className="template-columns">
                      {template.columns.map((col, idx) => (
                        <span key={idx} className="template-column-pill">
                          {searchQuery ? 
                            <span dangerouslySetInnerHTML={{ __html: highlightMatch(col, searchQuery) }} /> : 
                            col
                          }
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
              );
            })}
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
export { BOARD_TEMPLATES };
