import { useState, useEffect, useCallback, useRef } from 'react';
import { Clipboard, Download, FileText, AlignLeft, Grid, Code } from 'react-feather';
import { useBoardContext, DEFAULT_BOARD_TITLE } from '../../context/BoardContext';
import { useNotification } from '../../context/NotificationContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';

const FORMAT_OPTIONS = [
  { value: 'markdown', label: 'Markdown', icon: FileText, ext: '.md' },
  { value: 'plaintext', label: 'Plain Text', icon: AlignLeft, ext: '.txt' },
  { value: 'csv', label: 'CSV', icon: Grid, ext: '.csv' },
  { value: 'json', label: 'JSON', icon: Code, ext: '.json' },
];

const ExportBoardModal = ({ isOpen, onClose }) => {
  const [format, setFormat] = useState('markdown');
  const [exportedContent, setExportedContent] = useState('');
  const { boardTitle, columns } = useBoardContext();
  const { showNotification } = useNotification();
  const modalRef = useRef(null);
  useFocusTrap(modalRef, isOpen, { onClose });

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
                color: card.color || null,
                tags: card.tags || [],
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
              color: card.color || null,
              tags: card.tags || [],
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
            const tagsStr = card.tags && card.tags.length > 0 ? ` [${card.tags.join('] [')}]` : '';
            markdown += `- **${card.content}** ${voteCount > 0 ? `(${voteCount} votes)` : ''}${tagsStr}\n`;

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
        const tagsStr = card.tags && card.tags.length > 0 ? ` [${card.tags.join('] [')}]` : '';

        // Use content as heading/title
        markdown += `### ${card.content} ${voteCount > 0 ? `(${voteCount} votes)` : ''}${tagsStr}\n\n`;

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
            const tagsStr = card.tags && card.tags.length > 0 ? ` (tags: ${card.tags.join(', ')})` : '';
            const content = `  • ${card.content} ${voteCount > 0 ? `(${voteCount} votes)` : ''}${tagsStr}`;
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
        const tagsStr = card.tags && card.tags.length > 0 ? ` (tags: ${card.tags.join(', ')})` : '';
        const content = card.content;
        text += `${content} ${voteCount > 0 ? `(${voteCount} votes)` : ''}${tagsStr}\n${'-'.repeat(content.length)}\n\n`;

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

  const generateCsvExport = useCallback(() => {
    const boardData = getBoardStructure();
    const rows = [];

    // CSV header
    rows.push(['Column', 'Group', 'Card', 'Votes', 'Tags', 'Comments', 'Reactions']);

    if (boardData.columns.length === 0) {
      return rows.map(row => row.map(escapeCsvField).join(',')).join('\n');
    }

    boardData.columns.forEach(column => {
      // Export grouped cards
      if (column.groups && column.groups.length > 0) {
        column.groups.forEach(group => {
          // Add group row itself if it has votes/comments/reactions
          if (group.votes > 0 || group.comments.length > 0 || group.reactions.length > 0) {
            rows.push([
              column.title,
              group.name,
              '',
              String(group.votes),
              '',
              group.comments.join('; '),
              group.reactions.map(r => `${r.emoji} (${r.count})`).join(', ')
            ]);
          }

          // Add each card in the group
          group.cards.forEach(card => {
            rows.push([
              column.title,
              group.name,
              card.content,
              String(card.votes),
              (card.tags || []).join(', '),
              card.comments.join('; '),
              card.reactions.map(r => `${r.emoji} (${r.count})`).join(', ')
            ]);
          });
        });
      }

      // Export ungrouped cards
      column.cards.forEach(card => {
        rows.push([
          column.title,
          '',
          card.content,
          String(card.votes),
          (card.tags || []).join(', '),
          card.comments.join('; '),
          card.reactions.map(r => `${r.emoji} (${r.count})`).join(', ')
        ]);
      });
    });

    return rows.map(row => row.map(escapeCsvField).join(',')).join('\n');
  }, [getBoardStructure]);

  const generateJsonExport = useCallback(() => {
    const boardData = getBoardStructure();
    return JSON.stringify(boardData, null, 2);
  }, [getBoardStructure]);

  // Generate export content when modal is opened or format changes
  useEffect(() => {
    if (isOpen) {
      try {
        const generators = {
          markdown: generateMarkdownExport,
          plaintext: generatePlainTextExport,
          csv: generateCsvExport,
          json: generateJsonExport,
        };
        const generator = generators[format];
        setExportedContent(generator ? generator() : generateMarkdownExport());
      } catch {
        // Error generating export - silent fallback
        setExportedContent('Error generating export. Please try again.');
      }
    }
  }, [isOpen, format, columns, boardTitle, generateMarkdownExport, generatePlainTextExport, generateCsvExport, generateJsonExport]);

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
        showNotification('Copied to clipboard');
        onClose();
      })
      .catch(() => {
        // Could not copy text - silent fallback
      });
  };

  const downloadFile = () => {
    const formatOption = FORMAT_OPTIONS.find(f => f.value === format);
    const ext = formatOption ? formatOption.ext : '.txt';
    const title = (boardTitle || DEFAULT_BOARD_TITLE).replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const filename = `${title}${ext}`;

    const mimeTypes = {
      markdown: 'text/markdown',
      plaintext: 'text/plain',
      csv: 'text/csv',
      json: 'application/json',
    };

    const blob = new Blob([exportedContent], { type: mimeTypes[format] || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showNotification(`Downloaded ${filename}`);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" role="presentation">
      <div ref={modalRef} className="modal-container export-modal" role="dialog" aria-modal="true" aria-labelledby="export-board-title">
        <div className="modal-header">
          <h2 id="export-board-title">Export Board</h2>
          <button className="close-button" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <div className="modal-body">
          <div className="format-selector">
            {FORMAT_OPTIONS.map(opt => {
              const Icon = opt.icon;
              return (
                <div className="format-option" key={opt.value}>
                  <label className={`format-label ${format === opt.value ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      value={opt.value}
                      checked={format === opt.value}
                      onChange={() => setFormat(opt.value)}
                      className="format-radio"
                    />
                    <Icon size={16} className="format-icon" />
                    <span className="format-name">{opt.label}</span>
                  </label>
                </div>
              );
            })}
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
            className="primary-button export-download-button"
            onClick={downloadFile}
          >
            <Download size={16} />
            Download File
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

/**
 * Escape a CSV field value, wrapping in quotes if it contains
 * commas, quotes, or newlines.
 */
function escapeCsvField(value) {
  if (value == null) {
    return '';
  }
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default ExportBoardModal;
