import { ref, set } from 'firebase/database';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addColumn, addCard, createBoardFromTemplate } from './boardUtils';
import { parseUrlSettings } from './urlSettings';
// Mock Firebase
vi.mock('./firebase', () => ({ database: {} }));

vi.mock('firebase/database', () => ({
  ref: vi.fn(() => 'mock-ref'),
  set: vi.fn(() => Promise.resolve()),
  remove: vi.fn(() => Promise.resolve())
}));

vi.mock('./ids', () => ({
  generateId: vi.fn(() => 'mock-id-123')
}));

vi.mock('./urlSettings', () => ({
  parseUrlSettings: vi.fn(() => ({ boardSettings: {} }))
}));

vi.mock('./workflowUtils', () => ({
  WORKFLOW_PHASES: {
    CREATION: 'CREATION',
    GROUPING: 'GROUPING',
    INTERACTIONS: 'INTERACTIONS',
    HEALTH_CHECK: 'HEALTH_CHECK',
    HEALTH_CHECK_RESULTS: 'HEALTH_CHECK_RESULTS',
    INTERACTION_REVEAL: 'INTERACTION_REVEAL',
    RESULTS: 'RESULTS',
    POLL: 'POLL',
    POLL_RESULTS: 'POLL_RESULTS'
  }
}));

describe('addColumn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls set() with correct path and data structure', async () => {
    await addColumn('board-1');

    expect(ref).toHaveBeenCalledWith({}, 'boards/board-1/columns/mock-id-123');
    expect(set).toHaveBeenCalledWith('mock-ref', {
      title: 'New Column',
      cards: {}
    });
  });

  it('uses generated ID for column path', async () => {
    await addColumn('board-1');

    expect(ref).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('mock-id-123')
    );
  });

  it('default title is "New Column"', async () => {
    await addColumn('board-1');

    expect(set).toHaveBeenCalledWith('mock-ref', expect.objectContaining({
      title: 'New Column'
    }));
  });

  it('custom title is passed through', async () => {
    await addColumn('board-1', 'To Do');

    expect(set).toHaveBeenCalledWith('mock-ref', expect.objectContaining({
      title: 'To Do'
    }));
  });

  it('rejects when boardId is falsy', async () => {
    await expect(addColumn('')).rejects.toThrow('Board ID is required');
    await expect(addColumn(null)).rejects.toThrow('Board ID is required');
    await expect(addColumn(undefined)).rejects.toThrow('Board ID is required');
  });
});

describe('addCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls set() with correct path and data structure', async () => {
    const user = { uid: 'user-1' };
    await addCard('board-1', 'col-1', 'My card', user);

    expect(ref).toHaveBeenCalledWith({}, 'boards/board-1/columns/col-1/cards/mock-id-123');
    expect(set).toHaveBeenCalledWith('mock-ref', expect.objectContaining({
      content: 'My card',
      votes: 0,
      createdBy: 'user-1'
    }));
  });

  it('card data includes content, votes:0, created timestamp, createdBy', async () => {
    const before = Date.now();
    const user = { uid: 'user-1' };
    await addCard('board-1', 'col-1', 'Hello', user);
    const after = Date.now();

    const cardData = set.mock.calls[0][1];
    expect(cardData.content).toBe('Hello');
    expect(cardData.votes).toBe(0);
    expect(cardData.created).toBeGreaterThanOrEqual(before);
    expect(cardData.created).toBeLessThanOrEqual(after);
    expect(cardData.createdBy).toBe('user-1');
  });

  it('trims whitespace from content', async () => {
    await addCard('board-1', 'col-1', '  trimmed  ', { uid: 'u1' });

    const cardData = set.mock.calls[0][1];
    expect(cardData.content).toBe('trimmed');
  });

  it('rejects when boardId is falsy', async () => {
    await expect(addCard('', 'col-1', 'text')).rejects.toThrow('Board ID is required');
    await expect(addCard(null, 'col-1', 'text')).rejects.toThrow('Board ID is required');
  });

  it('rejects when columnId is falsy', async () => {
    await expect(addCard('board-1', '', 'text')).rejects.toThrow('Column ID is required');
    await expect(addCard('board-1', null, 'text')).rejects.toThrow('Column ID is required');
  });

  it('rejects when content is empty or whitespace', async () => {
    await expect(addCard('board-1', 'col-1', '')).rejects.toThrow('Card content is required');
    await expect(addCard('board-1', 'col-1', '   ')).rejects.toThrow('Card content is required');
    await expect(addCard('board-1', 'col-1', null)).rejects.toThrow('Card content is required');
  });

  it('handles null user (createdBy: null)', async () => {
    await addCard('board-1', 'col-1', 'No user card');

    const cardData = set.mock.calls[0][1];
    expect(cardData.createdBy).toBeNull();
  });

  it('returns cardId on success', async () => {
    const result = await addCard('board-1', 'col-1', 'test', { uid: 'u1' });
    expect(result).toBe('mock-id-123');
  });
});

describe('createBoardFromTemplate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls set() with correct board data structure', async () => {
    const user = { uid: 'user-1' };
    await createBoardFromTemplate({
      columns: ['To Do', 'In Progress', 'Done'],
      templateName: 'Basic',
      user
    });

    expect(set).toHaveBeenCalledWith(
      'mock-ref',
      expect.objectContaining({
        title: expect.any(String),
        created: expect.any(Number),
        owner: 'user-1',
        columns: expect.any(Object),
        settings: expect.any(Object)
      })
    );
  });

  it('board title uses templateName when provided', async () => {
    const user = { uid: 'user-1' };
    await createBoardFromTemplate({
      columns: ['A', 'B'],
      templateName: 'Custom',
      user
    });

    const boardData = set.mock.calls[0][1];
    expect(boardData.title).toBe('Custom Board');
  });

  it('board title defaults to "Untitled Board" when templateName is null', async () => {
    const user = { uid: 'user-1' };
    await createBoardFromTemplate({
      columns: ['A'],
      templateName: null,
      user
    });

    const boardData = set.mock.calls[0][1];
    expect(boardData.title).toBe('Untitled Board');
  });

  it('columns are created with alphabetical prefixes', async () => {
    const user = { uid: 'user-1' };
    await createBoardFromTemplate({
      columns: ['To Do', 'In Progress', 'Done'],
      user
    });

    const boardData = set.mock.calls[0][1];
    const columnKeys = Object.keys(boardData.columns);

    expect(columnKeys[0]).toMatch(/^a_/);
    expect(columnKeys[1]).toMatch(/^b_/);
    expect(columnKeys[2]).toMatch(/^c_/);
  });

  it('column objects have title and empty cards object', async () => {
    const user = { uid: 'user-1' };
    await createBoardFromTemplate({
      columns: ['Col1', 'Col2'],
      user
    });

    const boardData = set.mock.calls[0][1];
    const columns = Object.values(boardData.columns);

    columns.forEach(col => {
      expect(col).toEqual({
        title: expect.any(String),
        cards: {}
      });
    });
  });

  it('default settings are set correctly', async () => {
    const user = { uid: 'user-1' };
    await createBoardFromTemplate({
      columns: ['A'],
      user
    });

    const boardData = set.mock.calls[0][1];
    expect(boardData.settings).toEqual({
      votingEnabled: true,
      downvotingEnabled: true,
      multipleVotesAllowed: false,
      sortByVotes: false,
      retrospectiveMode: false,
      workflowPhase: 'CREATION',
      resultsViewIndex: 0
    });
  });

  it('URL settings overrides are applied when queryString is provided', async () => {
    const user = { uid: 'user-1' };
    vi.mocked(parseUrlSettings).mockReturnValue({
      boardSettings: {
        votingEnabled: false,
        retrospectiveMode: true
      }
    });

    await createBoardFromTemplate({
      columns: ['A'],
      user,
      queryString: '?votingEnabled=false&retrospectiveMode=true'
    });

    const boardData = set.mock.calls[0][1];
    expect(boardData.settings.votingEnabled).toBe(false);
    expect(boardData.settings.retrospectiveMode).toBe(true);
  });

  it('only allowed settings keys are overridden', async () => {
    const user = { uid: 'user-1' };
    vi.mocked(parseUrlSettings).mockReturnValue({
      boardSettings: {
        votingEnabled: false,
        downvotingEnabled: false,
        multipleVotesAllowed: true,
        votesPerUser: 3,
        retrospectiveMode: true,
        sortByVotes: true,
        unauthorizedKey: 'should-not-appear'
      }
    });

    await createBoardFromTemplate({
      columns: ['A'],
      user,
      queryString: '?test=1'
    });

    const boardData = set.mock.calls[0][1];
    expect(boardData.settings.votingEnabled).toBe(false);
    expect(boardData.settings.downvotingEnabled).toBe(false);
    expect(boardData.settings.multipleVotesAllowed).toBe(true);
    expect(boardData.settings.votesPerUser).toBe(3);
    expect(boardData.settings.retrospectiveMode).toBe(true);
    expect(boardData.settings.sortByVotes).toBe(true);
    expect(boardData.settings.unauthorizedKey).toBeUndefined();
  });

  it('rejects when user is null', async () => {
    await expect(
      createBoardFromTemplate({
        columns: ['A'],
        user: null
      })
    ).rejects.toThrow('User is required');
  });

  it('rejects when user uid is missing', async () => {
    await expect(
      createBoardFromTemplate({
        columns: ['A'],
        user: {}
      })
    ).rejects.toThrow('User is required');
  });

  it('returns the new board ID on success', async () => {
    const user = { uid: 'user-1' };
    const result = await createBoardFromTemplate({
      columns: ['A'],
      user
    });

    expect(result).toBe('mock-id-123');
  });

  it('uses default columns when columns param is null', async () => {
    const user = { uid: 'user-1' };
    await createBoardFromTemplate({
      columns: null,
      user
    });

    const boardData = set.mock.calls[0][1];
    const columnTitles = Object.values(boardData.columns).map(c => c.title);

    expect(columnTitles).toEqual(['To Do', 'In Progress', 'Done']);
  });

  it('uses default columns when columns param is undefined', async () => {
    const user = { uid: 'user-1' };
    await createBoardFromTemplate({
      user
    });

    const boardData = set.mock.calls[0][1];
    const columnTitles = Object.values(boardData.columns).map(c => c.title);

    expect(columnTitles).toEqual(['To Do', 'In Progress', 'Done']);
  });
});
