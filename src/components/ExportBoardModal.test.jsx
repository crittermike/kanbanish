import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import ExportBoardModal from './modals/ExportBoardModal';

// Mock the BoardContext
const mockBoardContext = {
  boardTitle: 'Test Board',
  columns: {
    'column1': {
      title: 'To Do',
      cards: {
        'card1': {
          content: 'Individual card',
          votes: 2,
          comments: {
            'comment1': { content: 'Test comment' }
          },
          reactions: {
            '👍': { count: 1 }
          }
        },
        'card2': {
          content: 'Grouped card 1',
          votes: 3,
          groupId: 'group1',
          comments: {
            'comment2': { content: 'Group comment' }
          },
          reactions: {
            '🎉': { count: 2 }
          }
        },
        'card3': {
          content: 'Grouped card 2', 
          votes: 1,
          groupId: 'group1'
        }
      },
      groups: {
        'group1': {
          name: 'Test Group',
          votes: 5,
          cardIds: ['card2', 'card3']
        }
      }
    }
  }
};

vi.mock('../context/BoardContext', () => ({
  useBoardContext: () => mockBoardContext
}));

describe('ExportBoardModal with Card Grouping', () => {
  const mockProps = {
    isOpen: true,
    onClose: vi.fn(),
    showNotification: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('includes groups in markdown export', () => {
    render(<ExportBoardModal {...mockProps} />);
    
    // Switch to markdown format (should be default)
    const markdownRadio = screen.getByRole('radio', { name: /markdown/i });
    fireEvent.click(markdownRadio);
    
    const exportContent = screen.getByRole('textbox');
    const content = exportContent.value;
    
    // Check that group is present with folder emoji
    expect(content).toContain('📁 Test Group');
    expect(content).toContain('(5 votes)');
    
    // Check that grouped cards are properly formatted as list items
    expect(content).toContain('- **Grouped card 1** (3 votes)');
    expect(content).toContain('- **Grouped card 2** (1 votes)');
    
    // Check that individual card is still present
    expect(content).toContain('### Individual card (2 votes)');
    
    // Check that comments and reactions are preserved for grouped cards (indented under list items)
    expect(content).toContain('  - **Comments:**');
    expect(content).toContain('    - Group comment');
    expect(content).toContain('  - **Reactions:**');
    expect(content).toContain('🎉 (2)');
    
    // Check that individual card is still present as header
    expect(content).toContain('### Individual card (2 votes)');
    
    // Check that ungrouped card comments and reactions are preserved
    expect(content).toContain('**Comments:**');
    expect(content).toContain('- Test comment');
    expect(content).toContain('**Reactions:**');
    expect(content).toContain('👍 (1)');
  });

  test('includes groups in plain text export', () => {
    render(<ExportBoardModal {...mockProps} />);
    
    // Switch to plain text format
    const plainTextRadio = screen.getByRole('radio', { name: /plain text/i });
    fireEvent.click(plainTextRadio);
    
    const exportContent = screen.getByRole('textbox');
    const content = exportContent.value;
    
    // Check that group is present with folder emoji
    expect(content).toContain('📁 Test Group (5 votes)');
    
    // Check that grouped cards are properly indented
    expect(content).toContain('  • Grouped card 1 (3 votes)');
    expect(content).toContain('  • Grouped card 2 (1 votes)');
    
    // Check that individual card is still present
    expect(content).toContain('Individual card (2 votes)');
    
    // Check that comments and reactions are preserved and properly indented for grouped cards
    expect(content).toContain('    Comments:');
    expect(content).toContain('    - Group comment');
    expect(content).toContain('    Reactions:');
    expect(content).toContain('🎉 (2)');
    
    // Check that ungrouped card comments are not indented  
    expect(content).toContain('Comments:\n- Test comment');
    expect(content).toContain('👍 (1)');
  });
});
