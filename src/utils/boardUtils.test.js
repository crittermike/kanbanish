import { ref, set } from 'firebase/database';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addColumn, addCard } from './boardUtils';
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
