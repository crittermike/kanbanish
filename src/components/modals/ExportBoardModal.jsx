import React, { useState, useEffect } from 'react';
import { useBoardContext } from '../../context/BoardContext';
import '../../styles/components/modals.css';

const ExportBoardModal = ({ isOpen, onClose, showNotification }) => {
  const [format, setFormat] = useState('markdown');
  const [exportedContent, setExportedContent] = useState('');
  const { boardTitle, columns } = useBoardContext();

  // Generate export content when modal is opened or format changes
  useEffect(() => {
    if (isOpen) {
      try {
        generateExport(format);
      } catch (error) {
        console.error('Error generating export:', error);
        setExportedContent('Error generating export. Please try again.');
      }
    }
  }, [isOpen, format, columns, boardTitle]);

  const generateExport = (selectedFormat) => {
    if (selectedFormat === 'markdown') {
      setExportedContent(generateMarkdownExport());
    } else {
      setExportedContent(generatePlainTextExport());
    }
  };

  const generateMarkdownExport = () => {
    let markdown = `# ${boardTitle || "Untitled Board"}\n\n`;
    
    if (!columns || Object.keys(columns).length === 0) {
      return markdown + "No columns found.";
    }
    
    // Sort columns by title to ensure workflow order: To Do, In Progress, Done
    const sortedColumns = Object.entries(columns).sort((a, b) => {
      // Define the order of standard column titles for various templates
      const columnOrder = {
        // Default template
        'To Do': 1,
        'In Progress': 2,
        'Done': 3,
        
        // Lean Coffee template
        'Topics': 1,
        'Discussing': 2,
        // 'Done': 3, (Already included)
        
        // Retrospective template
        'Went Well': 1,
        'Could Improve': 2,
        'Action Items': 3,
        
        // Feelings / Improvements template
        'Feelings': 1,
        'Improvements': 2,
        
        // DAKI template
        'Drop': 1,
        'Add': 2,
        'Keep': 3,
        'Improve': 4,
        
        // Glad Sad Mad template
        'Glad': 1,
        'Sad': 2,
        'Mad': 3,
        
        // Start Stop Continue template
        'Start': 1,
        'Stop': 2,
        'Continue': 3,
        
        // 4 Ls template
        'Liked': 1,
        'Learned': 2,
        'Lacked': 3,
        'Longed For': 4,
        
        // SWOT template
        'Strengths': 1,
        'Weaknesses': 2,
        'Opportunities': 3,
        'Threats': 4,
        
        // Six Thinking Hats
        'Facts': 1,
        'Emotions': 2,
        'Critical': 3,
        'Optimistic': 4,
        'Creative': 5,
        'Process': 6,
        
        // MoSCoW
        'Must Have': 1,
        'Should Have': 2,
        'Could Have': 3,
        'Won\'t Have': 4,
        
        // Five Whys
        'Problem': 1,
        'Why 1': 2,
        'Why 2': 3,
        'Why 3': 4,
        'Why 4': 5,
        'Why 5': 6,
        'Root Cause': 7,
        
        // Eisenhower
        'Urgent & Important': 1,
        'Important & Not Urgent': 2,
        'Urgent & Not Important': 3,
        'Neither': 4,
        
        // Sailboat
        'Wind (Helps)': 1,
        'Anchors (Hinders)': 2,
        'Rocks (Risks)': 3,
        'Island (Goals)': 4,
        
        // Fishbone
        'People': 1,
        'Process': 2,
        'Equipment': 3,
        'Materials': 4,
        'Environment': 5,
        'Management': 6,
        
        // Feedback Grid
        'What Went Well': 1,
        'What Could Be Improved': 2,
        'Questions': 3,
        'Ideas': 4,
        
        // Starfish
        'Keep Doing': 1,
        'Less Of': 2,
        'More Of': 3,
        'Start Doing': 4,
        'Stop Doing': 5,
        
        // KPT
        'Keep': 1,
        'Problem': 2,
        'Try': 3,
        
        // Pros & Cons
        'Pros': 1,
        'Cons': 2,
        'Decisions': 3
      };
      
      // Get the order for each column, defaulting to a high number for custom columns
      const orderA = columnOrder[a[1].title] || 100;
      const orderB = columnOrder[b[1].title] || 100;
      
      // Sort by the defined order
      return orderA - orderB;
    });
    
    sortedColumns.forEach(([columnId, column]) => {
      if (!column) return;
      
      markdown += `## ${column.title || "Untitled Column"}\n\n`;
      
      if (column.cards) {
        Object.entries(column.cards).forEach(([cardId, card]) => {
          // Card content as heading with vote count
          const voteCount = card.votes ? Object.keys(card.votes).length : 0;
          const content = card.content || "Empty Card";
          
          // Use content as heading/title
          markdown += `### ${content} ${voteCount > 0 ? `(${voteCount} votes)` : ''}\n\n`;
          
          // Comments
          if (card.comments && Object.keys(card.comments).length > 0) {
            markdown += `**Comments:**\n\n`;
            Object.entries(card.comments).forEach(([commentId, comment]) => {
              if (comment && comment.content) {
                markdown += `- ${comment.content}\n`;
              }
            });
            markdown += '\n';
          }
          
          // Reactions
          if (card.reactions && Object.keys(card.reactions).length > 0) {
            const validReactions = Object.entries(card.reactions)
              .filter(([emoji, reactionData]) => (reactionData?.count || 0) > 0);
              
            if (validReactions.length > 0) {
              markdown += `**Reactions:** `;
              validReactions.forEach(([emoji, reactionData], index, array) => {
                if (emoji) {
                  const count = reactionData?.count || 0;
                  markdown += `${emoji} (${count})${index < array.length - 1 ? ', ' : ''}`;
                }
              });
              markdown += '\n\n';
            }
          }
        });
      }
      
      markdown += '\n';
    });
    
    return markdown;
  };

  const generatePlainTextExport = () => {
    let text = `${boardTitle || "Untitled Board"}\n\n`;
    
    if (!columns || Object.keys(columns).length === 0) {
      return text + "No columns found.";
    }
    
    // Sort columns by title to ensure workflow order: To Do, In Progress, Done
    const sortedColumns = Object.entries(columns).sort((a, b) => {
      // Define the order of standard column titles for various templates
      const columnOrder = {
        // Default template
        'To Do': 1,
        'In Progress': 2,
        'Done': 3,
        
        // Lean Coffee template
        'Topics': 1,
        'Discussing': 2,
        // 'Done': 3, (Already included)
        
        // Retrospective template
        'Went Well': 1,
        'Could Improve': 2,
        'Action Items': 3,
        
        // Feelings / Improvements template
        'Feelings': 1,
        'Improvements': 2,
        
        // DAKI template
        'Drop': 1,
        'Add': 2,
        'Keep': 3,
        'Improve': 4,
        
        // Glad Sad Mad template
        'Glad': 1,
        'Sad': 2,
        'Mad': 3,
        
        // Start Stop Continue template
        'Start': 1,
        'Stop': 2,
        'Continue': 3,
        
        // 4 Ls template
        'Liked': 1,
        'Learned': 2,
        'Lacked': 3,
        'Longed For': 4,
        
        // SWOT template
        'Strengths': 1,
        'Weaknesses': 2,
        'Opportunities': 3,
        'Threats': 4,
        
        // Six Thinking Hats
        'Facts': 1,
        'Emotions': 2,
        'Critical': 3,
        'Optimistic': 4,
        'Creative': 5,
        'Process': 6,
        
        // MoSCoW
        'Must Have': 1,
        'Should Have': 2,
        'Could Have': 3,
        'Won\'t Have': 4,
        
        // Five Whys
        'Problem': 1,
        'Why 1': 2,
        'Why 2': 3,
        'Why 3': 4,
        'Why 4': 5,
        'Why 5': 6,
        'Root Cause': 7,
        
        // Eisenhower
        'Urgent & Important': 1,
        'Important & Not Urgent': 2,
        'Urgent & Not Important': 3,
        'Neither': 4,
        
        // Sailboat
        'Wind (Helps)': 1,
        'Anchors (Hinders)': 2,
        'Rocks (Risks)': 3,
        'Island (Goals)': 4,
        
        // Fishbone
        'People': 1,
        'Process': 2,
        'Equipment': 3,
        'Materials': 4,
        'Environment': 5,
        'Management': 6,
        
        // Feedback Grid
        'What Went Well': 1,
        'What Could Be Improved': 2,
        'Questions': 3,
        'Ideas': 4,
        
        // Starfish
        'Keep Doing': 1,
        'Less Of': 2,
        'More Of': 3,
        'Start Doing': 4,
        'Stop Doing': 5,
        
        // KPT
        'Keep': 1,
        'Problem': 2,
        'Try': 3,
        
        // Pros & Cons
        'Pros': 1,
        'Cons': 2,
        'Decisions': 3
      };
      
      // Get the order for each column, defaulting to a high number for custom columns
      const orderA = columnOrder[a[1].title] || 100;
      const orderB = columnOrder[b[1].title] || 100;
      
      // Sort by the defined order
      return orderA - orderB;
    });
    
    sortedColumns.forEach(([columnId, column]) => {
      if (!column) return;
      
      const title = column.title || "Untitled Column";
      text += `${title}\n${'='.repeat(title.length)}\n\n`;
      
      if (column.cards) {
        Object.entries(column.cards).forEach(([cardId, card]) => {
          // Card content as heading with vote count
          const voteCount = card.votes ? Object.keys(card.votes).length : 0;
          const content = card.content || "Empty Card";
          text += `${content} ${voteCount > 0 ? `(${voteCount} votes)` : ''}\n${'-'.repeat(content.length)}\n\n`;
          
          // Comments
          if (card.comments && Object.keys(card.comments).length > 0) {
            text += `Comments:\n`;
            Object.entries(card.comments).forEach(([commentId, comment]) => {
              if (comment && comment.content) {
                text += `- ${comment.content}\n`;
              }
            });
            text += '\n';
          }
          
          // Reactions
          if (card.reactions && Object.keys(card.reactions).length > 0) {
            const validReactions = Object.entries(card.reactions)
              .filter(([emoji, reactionData]) => (reactionData?.count || 0) > 0);
              
            if (validReactions.length > 0) {
              text += `Reactions: `;
              validReactions.forEach(([emoji, reactionData], index, array) => {
                if (emoji) {
                  const count = reactionData?.count || 0;
                  text += `${emoji} (${count})${index < array.length - 1 ? ', ' : ''}`;
                }
              });
            }
            text += '\n\n';
          }
        });
      }
      
      text += '\n';
    });
    
    return text;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(exportedContent)
      .then(() => {
        if (showNotification) {
          showNotification('Copied to clipboard');
        }
        onClose();
      })
      .catch(err => {
        console.error('Could not copy text: ', err);
      });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Export Board</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="format-selector">
            <div className="format-option">
              <label className={`format-label ${format === 'markdown' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  value="markdown"
                  checked={format === 'markdown'}
                  onChange={() => setFormat('markdown')}
                  className="format-radio"
                />
                <span className="format-name">Markdown</span>
              </label>
            </div>
            
            <div className="format-option">
              <label className={`format-label ${format === 'plaintext' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  value="plaintext"
                  checked={format === 'plaintext'}
                  onChange={() => setFormat('plaintext')}
                  className="format-radio"
                />
                <span className="format-name">Plain Text</span>
              </label>
            </div>
          </div>
          <div className="export-preview">
            <textarea
              readOnly
              value={exportedContent}
              className="export-content"
            />
          </div>
        </div>
        <div className="modal-footer">
          <button 
            className="primary-button"
            onClick={copyToClipboard}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
              <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
            </svg>
            Copy to Clipboard
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

export default ExportBoardModal;
