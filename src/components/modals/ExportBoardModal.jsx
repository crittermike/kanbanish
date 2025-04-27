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
  
  /**
   * Note on column ordering:
   * 
   * We rely on the natural ordering of column IDs to determine export order.
   * When columns are created via templates or manually, they receive IDs with
   * alphabetical prefixes (a_, b_, c_, etc.) to ensure consistent ordering.
   * 
   * This approach ensures that the export order matches what users see on the board.
   */

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
    
    // Use the natural order from column IDs (which should be prefixed alphabetically)
    // This keeps the same order as displayed on the board
    const sortedColumns = Object.entries(columns).sort((a, b) => {
      // Sort by column ID which preserves the order they're displayed in
      return a[0].localeCompare(b[0]);
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
    
    // Use the natural order from column IDs (which should be prefixed alphabetically)
    // This keeps the same order as displayed on the board
    const sortedColumns = Object.entries(columns).sort((a, b) => {
      // Sort by column ID which preserves the order they're displayed in
      return a[0].localeCompare(b[0]);
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
