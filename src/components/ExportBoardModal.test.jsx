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
        },
        'card4': {
          content: 'Tagged card',
          votes: 0,
          tags: ['urgent', 'bug']
        }
      },
      groups: {
        'group1': {
          name: 'Test Group',
          votes: 5,
          cardIds: ['card2', 'card3'],
          comments: {
            'gcomment1': { content: 'Group-level comment' }
          },
          reactions: {
            '🔥': { count: 3 }
          }
        }
      }
    }
  }
};

vi.mock('../context/BoardContext', () => ({
  useBoardContext: () => mockBoardContext,
  DEFAULT_BOARD_TITLE: 'My Board'
}));
// Mock the NotificationContext
const { mockShowNotification } = vi.hoisted(() => ({
  mockShowNotification: vi.fn()
}));
vi.mock('../context/NotificationContext', () => ({
  useNotification: () => ({
    showNotification: mockShowNotification,
    notification: { message: '', show: false }
  }),
  NotificationProvider: ({ children }) => children
}));


describe('ExportBoardModal with Card Grouping', () => {
  const mockProps = {
    isOpen: true,
    onClose: vi.fn(),
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

describe('ExportBoardModal - CSV format', () => {
  const mockProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('generates CSV with correct headers', () => {
    render(<ExportBoardModal {...mockProps} />);

    const csvRadio = screen.getByRole('radio', { name: /csv/i });
    fireEvent.click(csvRadio);

    const exportContent = screen.getByRole('textbox');
    const content = exportContent.value;
    const lines = content.split('\n');

    expect(lines[0]).toBe('Column,Group,Card,Votes,Tags,Comments,Reactions');
  });

  test('includes grouped and ungrouped cards in CSV', () => {
    render(<ExportBoardModal {...mockProps} />);

    const csvRadio = screen.getByRole('radio', { name: /csv/i });
    fireEvent.click(csvRadio);

    const exportContent = screen.getByRole('textbox');
    const content = exportContent.value;

    // Check group row exists with group-level data
    expect(content).toContain('To Do');
    expect(content).toContain('Test Group');
    expect(content).toContain('Grouped card 1');
    expect(content).toContain('Grouped card 2');
    expect(content).toContain('Individual card');
  });

  test('properly escapes CSV fields with commas', () => {
    render(<ExportBoardModal {...mockProps} />);

    const csvRadio = screen.getByRole('radio', { name: /csv/i });
    fireEvent.click(csvRadio);

    const exportContent = screen.getByRole('textbox');
    const content = exportContent.value;

    // Tags should be comma-separated and quoted in CSV
    expect(content).toContain('"urgent, bug"');
  });

  test('includes reactions in CSV format', () => {
    render(<ExportBoardModal {...mockProps} />);

    const csvRadio = screen.getByRole('radio', { name: /csv/i });
    fireEvent.click(csvRadio);

    const exportContent = screen.getByRole('textbox');
    const content = exportContent.value;

    // Card reactions
    expect(content).toContain('🎉 (2)');
    expect(content).toContain('👍 (1)');
    // Group reactions
    expect(content).toContain('🔥 (3)');
  });
});

describe('ExportBoardModal - JSON format', () => {
  const mockProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('generates valid JSON', () => {
    render(<ExportBoardModal {...mockProps} />);

    const jsonRadio = screen.getByRole('radio', { name: /json/i });
    fireEvent.click(jsonRadio);

    const exportContent = screen.getByRole('textbox');
    const content = exportContent.value;

    // Should be valid JSON
    const parsed = JSON.parse(content);
    expect(parsed).toBeDefined();
    expect(parsed.title).toBe('Test Board');
  });

  test('JSON contains complete board structure', () => {
    render(<ExportBoardModal {...mockProps} />);

    const jsonRadio = screen.getByRole('radio', { name: /json/i });
    fireEvent.click(jsonRadio);

    const exportContent = screen.getByRole('textbox');
    const parsed = JSON.parse(exportContent.value);

    // Check top-level structure
    expect(parsed.title).toBe('Test Board');
    expect(parsed.columns).toHaveLength(1);
    expect(parsed.columns[0].title).toBe('To Do');

    // Check groups
    expect(parsed.columns[0].groups).toHaveLength(1);
    expect(parsed.columns[0].groups[0].name).toBe('Test Group');
    expect(parsed.columns[0].groups[0].votes).toBe(5);
    expect(parsed.columns[0].groups[0].cards).toHaveLength(2);

    // Check ungrouped cards
    const ungroupedCards = parsed.columns[0].cards;
    expect(ungroupedCards.length).toBeGreaterThanOrEqual(1);
    const individualCard = ungroupedCards.find(c => c.content === 'Individual card');
    expect(individualCard).toBeDefined();
    expect(individualCard.votes).toBe(2);
  });

  test('JSON includes comments and reactions', () => {
    render(<ExportBoardModal {...mockProps} />);

    const jsonRadio = screen.getByRole('radio', { name: /json/i });
    fireEvent.click(jsonRadio);

    const exportContent = screen.getByRole('textbox');
    const parsed = JSON.parse(exportContent.value);

    // Check card comments
    const individualCard = parsed.columns[0].cards.find(c => c.content === 'Individual card');
    expect(individualCard.comments).toContain('Test comment');
    expect(individualCard.reactions).toEqual([{ emoji: '👍', count: 1 }]);

    // Check group-level data
    const group = parsed.columns[0].groups[0];
    expect(group.comments).toContain('Group-level comment');
    expect(group.reactions).toEqual([{ emoji: '🔥', count: 3 }]);

    // Check grouped card comments
    const groupedCard = group.cards.find(c => c.content === 'Grouped card 1');
    expect(groupedCard.comments).toContain('Group comment');
  });

  test('JSON includes tags', () => {
    render(<ExportBoardModal {...mockProps} />);

    const jsonRadio = screen.getByRole('radio', { name: /json/i });
    fireEvent.click(jsonRadio);

    const exportContent = screen.getByRole('textbox');
    const parsed = JSON.parse(exportContent.value);

    const taggedCard = parsed.columns[0].cards.find(c => c.content === 'Tagged card');
    expect(taggedCard).toBeDefined();
    expect(taggedCard.tags).toEqual(['urgent', 'bug']);
  });
});

describe('ExportBoardModal - format selector UI', () => {
  const mockProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders all four format options', () => {
    render(<ExportBoardModal {...mockProps} />);

    expect(screen.getByRole('radio', { name: /markdown/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /plain text/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /csv/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /json/i })).toBeInTheDocument();
  });

  test('defaults to markdown format', () => {
    render(<ExportBoardModal {...mockProps} />);

    const markdownRadio = screen.getByRole('radio', { name: /markdown/i });
    expect(markdownRadio).toBeChecked();
  });

  test('shows copy and download buttons', () => {
    render(<ExportBoardModal {...mockProps} />);

    expect(screen.getByText('Copy to Clipboard')).toBeInTheDocument();
    expect(screen.getByText('Download File')).toBeInTheDocument();
  });

  test('copy to clipboard calls navigator API', async () => {
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: mockWriteText }
    });

    render(<ExportBoardModal {...mockProps} />);

    const copyButton = screen.getByText('Copy to Clipboard');
    fireEvent.click(copyButton);

    expect(mockWriteText).toHaveBeenCalled();
  });
});

describe('ExportBoardModal - download', () => {
  const mockProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('download creates a blob and triggers download', () => {
    const mockCreateObjectURL = vi.fn().mockReturnValue('blob:test');
    const mockRevokeObjectURL = vi.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    render(<ExportBoardModal {...mockProps} />);

    const downloadButton = screen.getByText('Download File');
    fireEvent.click(downloadButton);

    // Verify Blob was created and URL lifecycle was managed
    expect(mockCreateObjectURL).toHaveBeenCalled();
    const blobArg = mockCreateObjectURL.mock.calls[0][0];
    expect(blobArg).toBeInstanceOf(Blob);
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:test');
  });

  test('download uses correct file extension for each format', () => {
    const mockCreateObjectURL = vi.fn().mockReturnValue('blob:test');
    const mockRevokeObjectURL = vi.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    // Track created anchor elements
    const createdLinks = [];
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = originalCreateElement(tag);
      if (tag === 'a') {
        createdLinks.push(el);
      }
      return el;
    });

    render(<ExportBoardModal {...mockProps} />);

    // Test markdown (default)
    fireEvent.click(screen.getByText('Download File'));
    expect(createdLinks[createdLinks.length - 1].download).toMatch(/\.md$/);

    // Switch to CSV and download
    fireEvent.click(screen.getByRole('radio', { name: /csv/i }));
    fireEvent.click(screen.getByText('Download File'));
    expect(createdLinks[createdLinks.length - 1].download).toMatch(/\.csv$/);

    // Switch to JSON and download
    fireEvent.click(screen.getByRole('radio', { name: /json/i }));
    fireEvent.click(screen.getByText('Download File'));
    expect(createdLinks[createdLinks.length - 1].download).toMatch(/\.json$/);

    document.createElement.mockRestore();
  });
});
