import React, { useState, useEffect } from 'react';
import { useBoardContext } from '../../context/BoardContext';
import { Clipboard } from 'react-feather';

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

  /**
   * Get a normalized structure of the board data for export
   * @returns {object} Normalized board data with sorted columns and cards
   */
  const getBoardStructure = () => {
    const boardData = {
      title: boardTitle || "Untitled Board",
      columns: []
    };
    
    if (!columns || Object.keys(columns).length === 0) {
      return boardData;
    }
    
    // Sort columns by their ID to maintain the same order as displayed on board
    const sortedColumns = Object.entries(columns).sort((a, b) => {
      return a[0].localeCompare(b[0]);
    });
    
    // Process each column
    sortedColumns.forEach(([columnId, column]) => {
      if (!column) return;
      
      const processedColumn = {
        title: column.title || "Untitled Column",
        cards: []
      };
      
      // Process cards in the column
      if (column.cards) {
        Object.entries(column.cards).forEach(([cardId, card]) => {
          // Process card data
          const processedCard = {
            content: card.content || "Empty Card",
            votes: card.votes || 0,
            comments: [],
            reactions: []
          };
          
          // Process comments
          if (card.comments && Object.keys(card.comments).length > 0) {
            Object.entries(card.comments).forEach(([commentId, comment]) => {
              if (comment && comment.content) {
                processedCard.comments.push(comment.content);
              }
            });
          }
          
          // Process reactions
          if (card.reactions && Object.keys(card.reactions).length > 0) {
            const validReactions = Object.entries(card.reactions)
              .filter(([emoji, reactionData]) => (reactionData?.count || 0) > 0);
              
            validReactions.forEach(([emoji, reactionData]) => {
              if (emoji) {
                const count = reactionData?.count || 0;
                processedCard.reactions.push({ emoji, count });
              }
            });
          }
          
          processedColumn.cards.push(processedCard);
        });
      }
      
      boardData.columns.push(processedColumn);
    });
    
    return boardData;
  };

  const generateExport = (selectedFormat) => {
    if (selectedFormat === 'markdown') {
      setExportedContent(generateMarkdownExport());
    } else {
      setExportedContent(generatePlainTextExport());
    }
  };

  const generateMarkdownExport = () => {
    const boardData = getBoardStructure();
    let markdown = `# ${boardData.title}\n\n`;
    
    if (boardData.columns.length === 0) {
      return markdown + "No columns found.";
    }
    
    boardData.columns.forEach(column => {
      markdown += `## ${column.title}\n\n`;
      
      column.cards.forEach(card => {
        // Card content as heading with vote count
        const voteCount = card.votes;
        
        // Use content as heading/title
        markdown += `### ${card.content} ${voteCount > 0 ? `(${voteCount} votes)` : ''}\n\n`;
        
        // Comments
        if (card.comments.length > 0) {
          markdown += `**Comments:**\n\n`;
          card.comments.forEach(comment => {
            markdown += `- ${comment}\n`;
          });
          markdown += '\n';
        }
        
        // Reactions
        if (card.reactions.length > 0) {
          markdown += `**Reactions:** `;
          card.reactions.forEach((reaction, index, array) => {
            markdown += `${reaction.emoji} (${reaction.count})${index < array.length - 1 ? ', ' : ''}`;
          });
          markdown += '\n\n';
        }
      });
      
      markdown += '\n';
    });
    
    return markdown;
  };

  const generatePlainTextExport = () => {
    const boardData = getBoardStructure();
    let text = `${boardData.title}\n\n`;
    
    if (boardData.columns.length === 0) {
      return text + "No columns found.";
    }
    
    boardData.columns.forEach(column => {
      const title = column.title;
      text += `${title}\n${'='.repeat(title.length)}\n\n`;
      
      column.cards.forEach(card => {
        // Card content as heading with vote count
        const voteCount = card.votes;
        const content = card.content;
        text += `${content} ${voteCount > 0 ? `(${voteCount} votes)` : ''}\n${'-'.repeat(content.length)}\n\n`;
        
        // Comments
        if (card.comments.length > 0) {
          text += `Comments:\n`;
          card.comments.forEach(comment => {
            text += `- ${comment}\n`;
          });
          text += '\n';
        }
        
        // Reactions
        if (card.reactions.length > 0) {
          text += `Reactions: `;
          card.reactions.forEach((reaction, index, array) => {
            text += `${reaction.emoji} (${reaction.count})${index < array.length - 1 ? ', ' : ''}`;
          });
          text += '\n\n';
        }
      });
      
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
            <Clipboard size={16} />
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
