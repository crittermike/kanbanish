// filepath: /Users/crittermike/Code/kanbanish/src/components/modals/NewBoardTemplateModal.jsx
import React, { useState, useEffect } from 'react';
import '../../styles/components/modals.css';
import '../../styles/components/template-select.css';

// Define board templates
const BOARD_TEMPLATES = [
  {
    id: 'default',
    name: 'Default',
    description: 'Standard kanban workflow',
    columns: ['To Do', 'In Progress', 'Done'],
    icon: '📋',
    tags: ['workflow', 'kanban', 'basic']
  },
  {
    id: 'lean-coffee',
    name: 'Lean Coffee',
    description: 'Topic-based discussion format',
    columns: ['Topics', 'Discussing', 'Done'],
    icon: '☕',
    tags: ['discussion', 'meeting', 'agenda']
  },
  {
    id: 'retro',
    name: 'Retrospective',
    description: 'Team reflection and action',
    columns: ['Went Well', 'Could Improve', 'Action Items'],
    icon: '🔄',
    tags: ['agile', 'reflection', 'team']
  },
  {
    id: 'feelings-improvements',
    name: 'Feelings / Improvements',
    description: 'Emotional feedback and solutions',
    columns: ['Feelings', 'Improvements'],
    icon: '❤️',
    tags: ['feedback', 'emotions', 'solutions']
  },
  {
    id: 'daki',
    name: 'DAKI',
    description: 'Drop Add Keep Improve',
    columns: ['Drop', 'Add', 'Keep', 'Improve'],
    icon: '✨',
    tags: ['reflection', 'processes', 'practices']
  },
  {
    id: 'glad-sad-mad',
    name: 'Glad Sad Mad',
    description: 'Emotional categorization',
    columns: ['Glad', 'Sad', 'Mad'],
    icon: '😊',
    tags: ['emotions', 'reflection', 'feedback']
  },
  {
    id: 'start-stop-continue',
    name: 'Start Stop Continue',
    description: 'Action-based reflection',
    columns: ['Start', 'Stop', 'Continue'],
    icon: '🚦',
    tags: ['action', 'feedback', 'improvement']
  },
  {
    id: '4ls',
    name: '4 Ls',
    description: 'Liked, Learned, Lacked, Longed For',
    columns: ['Liked', 'Learned', 'Lacked', 'Longed For'],
    icon: '📝',
    tags: ['reflection', 'learning', 'retrospective']
  },
  {
    id: 'swot',
    name: 'SWOT',
    description: 'Strategic planning tool',
    columns: ['Strengths', 'Weaknesses', 'Opportunities', 'Threats'],
    icon: '📊',
    tags: ['strategy', 'planning', 'analysis']
  },
  // Additional templates
  {
    id: 'six-thinking-hats',
    name: 'Six Thinking Hats',
    description: 'Parallel thinking perspectives',
    columns: ['Facts', 'Emotions', 'Critical', 'Optimistic', 'Creative', 'Process'],
    icon: '🎩',
    tags: ['thinking', 'perspectives', 'discussion']
  },
  {
    id: 'moscow',
    name: 'MoSCoW',
    description: 'Prioritization framework',
    columns: ['Must Have', 'Should Have', 'Could Have', 'Won\'t Have'],
    icon: '📌',
    tags: ['prioritization', 'planning', 'requirements']
  },
  {
    id: 'five-whys',
    name: 'Five Whys',
    description: 'Root cause analysis',
    columns: ['Problem', 'Why 1', 'Why 2', 'Why 3', 'Why 4', 'Why 5', 'Root Cause'],
    icon: '🔍',
    tags: ['problem solving', 'analysis', 'causes']
  },
  {
    id: 'eisenhower',
    name: 'Eisenhower Matrix',
    description: 'Urgent vs Important decision making',
    columns: ['Urgent & Important', 'Important & Not Urgent', 'Urgent & Not Important', 'Neither'],
    icon: '⏱️',
    tags: ['decision', 'prioritization', 'time management']
  },
  {
    id: 'sailboat',
    name: 'Sailboat Retrospective',
    description: 'Visual metaphor for team journey',
    columns: ['Wind (Helps)', 'Anchors (Hinders)', 'Rocks (Risks)', 'Island (Goals)'],
    icon: '⛵',
    tags: ['retrospective', 'visual', 'team']
  },
  {
    id: 'fishbone',
    name: 'Fishbone',
    description: 'Cause and effect analysis',
    columns: ['People', 'Process', 'Equipment', 'Materials', 'Environment', 'Management'],
    icon: '🐟',
    tags: ['analysis', 'causes', 'problem solving']
  },
  {
    id: 'feedback-grid',
    name: 'Feedback Grid',
    description: 'Structured feedback collection',
    columns: ['What Went Well', 'What Could Be Improved', 'Questions', 'Ideas'],
    icon: '🔄',
    tags: ['feedback', 'collection', 'reflection']
  },
  {
    id: 'starfish',
    name: 'Starfish Retrospective',
    description: 'Five-part retrospective model',
    columns: ['Keep Doing', 'Less Of', 'More Of', 'Start Doing', 'Stop Doing'],
    icon: '⭐',
    tags: ['retrospective', 'actions', 'team']
  },
  {
    id: 'kpt',
    name: 'KPT',
    description: 'Keep, Problem, Try',
    columns: ['Keep', 'Problem', 'Try'],
    icon: '🔑',
    tags: ['retrospective', 'simple', 'actions']
  },
  {
    id: 'pro-con',
    name: 'Pros & Cons',
    description: 'Decision making helper',
    columns: ['Pros', 'Cons', 'Decisions'],
    icon: '⚖️',
    tags: ['decision', 'evaluation', 'analysis']
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Start with a blank slate',
    columns: ['Untitled'],
    icon: '✏️',
    tags: ['custom', 'blank', 'flexible']
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
                  <h3>{highlightedName}</h3>
                  <p>{highlightedDesc}</p>
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
