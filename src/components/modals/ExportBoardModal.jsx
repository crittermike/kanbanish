import { useState, useEffect, useCallback } from 'react';
import { Clipboard } from 'react-feather';
import { useBoardContext, DEFAULT_BOARD_TITLE } from '../../context/BoardContext';

const ExportBoardModal = ({ isOpen, onClose, showNotification }) => {
  const [format, setFormat] = useState('markdown');
  const [exportedContent, setExportedContent] = useState('');
  const { boardTitle, columns } = useBoardContext();

  /**
   * Get a normalized structure of the board data for export
   * @returns {object} Normalized board data with sorted columns, groups, and cards
   */
  const getBoardStructure = useCallback(() => {
    const boardData = {
      title: boardTitle || DEFAULT_BOARD_TITLE,
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
    sortedColumns.forEach(([_columnId, column]) => {
      if (!column) {
        return;
      }

      const processedColumn = {
        title: column.title || 'Untitled Column',
        cards: []
      };

      // Process groups first, then ungrouped cards
      const processedGroups = [];
      const ungroupedCards = [];

      // Process groups
      if (column.groups) {
        Object.entries(column.groups).forEach(([_groupId, group]) => {
          if (!group || !group.cardIds) {
            return;
          }

          const processedGroup = {
            name: group.name,
            votes: group.votes || 0,
            comments: [],
            reactions: [],
            cards: []
          };

          // Process group comments
          if (group.comments && Object.keys(group.comments).length > 0) {
            Object.entries(group.comments).forEach(([_commentId, comment]) => {
              if (comment && comment.content) {
                processedGroup.comments.push(comment.content);
              }
            });
          }

          // Process group reactions
          if (group.reactions && Object.keys(group.reactions).length > 0) {
            const validReactions = Object.entries(group.reactions)
              .filter(([_emoji, reactionData]) => (reactionData?.count || 0) > 0);

            validReactions.forEach(([emoji, reactionData]) => {
              if (emoji) {
                const count = reactionData?.count || 0;
                processedGroup.reactions.push({ emoji, count });
              }
            });
          }

          // Process cards in this group
          group.cardIds.forEach(cardId => {
            const card = column.cards?.[cardId];
            if (card) {
              const processedCard = {
                content: card.content,
                votes: card.votes || 0,
                comments: [],
                reactions: []
              };

              // Process comments
              if (card.comments && Object.keys(card.comments).length > 0) {
                Object.entries(card.comments).forEach(([_commentId, comment]) => {
                  if (comment && comment.content) {
                    processedCard.comments.push(comment.content);
                  }
                });
              }

              // Process reactions
              if (card.reactions && Object.keys(card.reactions).length > 0) {
                const validReactions = Object.entries(card.reactions)
                  .filter(([_emoji, reactionData]) => (reactionData?.count || 0) > 0);

                validReactions.forEach(([emoji, reactionData]) => {
                  if (emoji) {
                    const count = reactionData?.count || 0;
                    processedCard.reactions.push({ emoji, count });
                  }
                });
              }

              processedGroup.cards.push(processedCard);
            }
          });

          processedGroups.push(processedGroup);
        });
      }

      // Process ungrouped cards
      if (column.cards) {
        Object.entries(column.cards).forEach(([_cardId, card]) => {
          // Only include cards that are not in any group
          if (!card.groupId) {
            const processedCard = {
              content: card.content,
              votes: card.votes || 0,
              comments: [],
              reactions: []
            };

            // Process comments
            if (card.comments && Object.keys(card.comments).length > 0) {
              Object.entries(card.comments).forEach(([_commentId, comment]) => {
                if (comment && comment.content) {
                  processedCard.comments.push(comment.content);
                }
              });
            }

            // Process reactions
            if (card.reactions && Object.keys(card.reactions).length > 0) {
              const validReactions = Object.entries(card.reactions)
                .filter(([_emoji, reactionData]) => (reactionData?.count || 0) > 0);

              validReactions.forEach(([emoji, reactionData]) => {
                if (emoji) {
                  const count = reactionData?.count || 0;
                  processedCard.reactions.push({ emoji, count });
                }
              });
            }

            ungroupedCards.push(processedCard);
          }
        });
      }

      // Store both groups and ungrouped cards
      processedColumn.groups = processedGroups;
      processedColumn.cards = ungroupedCards;

      boardData.columns.push(processedColumn);
    });

    return boardData;
  }, [columns, boardTitle]);

  const generateMarkdownExport = useCallback(() => {
    const boardData = getBoardStructure();
    let markdown = `# ${boardData.title}\n\n`;

    if (boardData.columns.length === 0) {
      return `${markdown}No columns found.`;
    }

    boardData.columns.forEach(column => {
      markdown += `## ${column.title}\n\n`;

      // Export groups first
      if (column.groups && column.groups.length > 0) {
        column.groups.forEach(group => {
          // Group heading with vote count
          const groupVoteCount = group.votes;
          markdown += `### 📁 ${group.name} ${groupVoteCount > 0 ? `(${groupVoteCount} votes)` : ''}\n\n`;

          // Group comments
          if (group.comments.length > 0) {
            markdown += '**Group Comments:**\n';
            group.comments.forEach(comment => {
              markdown += `- ${comment}\n`;
            });
            markdown += '\n';
          }

          // Group reactions
          if (group.reactions.length > 0) {
            markdown += '**Group Reactions:** ';
            group.reactions.forEach((reaction, index, array) => {
              markdown += `${reaction.emoji} (${reaction.count})${index < array.length - 1 ? ', ' : ''}`;
            });
            markdown += '\n\n';
          }

          // Cards within the group as list items
          group.cards.forEach(card => {
            const voteCount = card.votes;
            markdown += `- **${card.content}** ${voteCount > 0 ? `(${voteCount} votes)` : ''}\n`;

            // Comments - indented under the list item
            if (card.comments.length > 0) {
              markdown += '  - **Comments:**\n';
              card.comments.forEach(comment => {
                markdown += `    - ${comment}\n`;
              });
            }

            // Reactions - indented under the list item
            if (card.reactions.length > 0) {
              markdown += '  - **Reactions:** ';
              card.reactions.forEach((reaction, index, array) => {
                markdown += `${reaction.emoji} (${reaction.count})${index < array.length - 1 ? ', ' : ''}`;
              });
              markdown += '\n';
            }

            markdown += '\n';
          });

          markdown += '\n';
        });
      }

      // Export ungrouped cards
      column.cards.forEach(card => {
        // Card content as heading with vote count
        const voteCount = card.votes;

        // Use content as heading/title
        markdown += `### ${card.content} ${voteCount > 0 ? `(${voteCount} votes)` : ''}\n\n`;

        // Comments
        if (card.comments.length > 0) {
          markdown += '**Comments:**\n\n';
          card.comments.forEach(comment => {
            markdown += `- ${comment}\n`;
          });
          markdown += '\n';
        }

        // Reactions
        if (card.reactions.length > 0) {
          markdown += '**Reactions:** ';
          card.reactions.forEach((reaction, index, array) => {
            markdown += `${reaction.emoji} (${reaction.count})${index < array.length - 1 ? ', ' : ''}`;
          });
          markdown += '\n\n';
        }
      });

      markdown += '\n';
    });

    return markdown;
  }, [getBoardStructure]);

  const generatePlainTextExport = useCallback(() => {
    const boardData = getBoardStructure();
    let text = `${boardData.title}\n\n`;

    if (boardData.columns.length === 0) {
      return `${text}No columns found.`;
    }

    boardData.columns.forEach(column => {
      const title = column.title;
      text += `${title}\n${'='.repeat(title.length)}\n\n`;

      // Export groups first
      if (column.groups && column.groups.length > 0) {
        column.groups.forEach(group => {
          // Group heading with vote count
          const groupVoteCount = group.votes;
          const groupTitle = `📁 ${group.name} ${groupVoteCount > 0 ? `(${groupVoteCount} votes)` : ''}`;
          text += `${groupTitle}\n${'-'.repeat(groupTitle.length)}\n\n`;

          // Group comments
          if (group.comments.length > 0) {
            text += 'Group Comments:\n';
            group.comments.forEach(comment => {
              text += `- ${comment}\n`;
            });
            text += '\n';
          }

          // Group reactions
          if (group.reactions.length > 0) {
            text += 'Group Reactions: ';
            group.reactions.forEach((reaction, index, array) => {
              text += `${reaction.emoji} (${reaction.count})${index < array.length - 1 ? ', ' : ''}`;
            });
            text += '\n\n';
          }

          // Cards within the group
          group.cards.forEach(card => {
            const voteCount = card.votes;
            const content = `  • ${card.content} ${voteCount > 0 ? `(${voteCount} votes)` : ''}`;
            text += `${content}\n`;

            // Comments
            if (card.comments.length > 0) {
              text += '    Comments:\n';
              card.comments.forEach(comment => {
                text += `    - ${comment}\n`;
              });
            }

            // Reactions
            if (card.reactions.length > 0) {
              text += '    Reactions: ';
              card.reactions.forEach((reaction, index, array) => {
                text += `${reaction.emoji} (${reaction.count})${index < array.length - 1 ? ', ' : ''}`;
              });
              text += '\n';
            }

            text += '\n';
          });

          text += '\n';
        });
      }

      // Export ungrouped cards
      column.cards.forEach(card => {
        // Card content as heading with vote count
        const voteCount = card.votes;
        const content = card.content;
        text += `${content} ${voteCount > 0 ? `(${voteCount} votes)` : ''}\n${'-'.repeat(content.length)}\n\n`;

        // Comments
        if (card.comments.length > 0) {
          text += 'Comments:\n';
          card.comments.forEach(comment => {
            text += `- ${comment}\n`;
          });
          text += '\n';
        }

        // Reactions
        if (card.reactions.length > 0) {
          text += 'Reactions: ';
          card.reactions.forEach((reaction, index, array) => {
            text += `${reaction.emoji} (${reaction.count})${index < array.length - 1 ? ', ' : ''}`;
          });
          text += '\n\n';
        }
      });

      text += '\n';
    });

    return text;
  }, [getBoardStructure]);

  // Generate export content when modal is opened or format changes
  useEffect(() => {
    if (isOpen) {
      try {
        if (format === 'markdown') {
          setExportedContent(generateMarkdownExport());
        } else {
          setExportedContent(generatePlainTextExport());
        }
      } catch {
        // Error generating export - silent fallback
        setExportedContent('Error generating export. Please try again.');
      }
    }
  }, [isOpen, format, columns, boardTitle, generateMarkdownExport, generatePlainTextExport]);

  /**
   * Note on column ordering and card grouping:
   *
   * We rely on the natural ordering of column IDs to determine export order.
   * When columns are created via templates or manually, they receive IDs with
   * alphabetical prefixes (a_, b_, c_, etc.) to ensure consistent ordering.
   *
   * For card grouping, the export respects the grouping structure by:
   * 1. Exporting all card groups first within each column
   * 2. Then exporting any ungrouped individual cards
   * 3. Groups are identified by the 📁 emoji prefix in the export
   * 4. Cards within groups are indented/nested under the group heading
   *
   * This approach ensures that the export order matches what users see on the board
   * and preserves the organizational structure created through card grouping.
   */

  const copyToClipboard = () => {
    navigator.clipboard.writeText(exportedContent)
      .then(() => {
        if (showNotification) {
          showNotification('Copied to clipboard');
        }
        onClose();
      })
      .catch(() => {
        // Could not copy text - silent fallback
      });
  };

  if (!isOpen) {
    return null;
  }

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
