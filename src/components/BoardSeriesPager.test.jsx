import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BoardSeriesPager from './BoardSeriesPager';

describe('BoardSeriesPager', () => {
  it('renders nothing when there are no series links', () => {
    const { container } = render(
      <BoardSeriesPager previousBoardId={null} nextBoardId={null} onNavigate={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders only the Previous button when only a previous board exists', () => {
    render(
      <BoardSeriesPager previousBoardId="prev-1" nextBoardId={null} onNavigate={() => {}} />
    );
    expect(screen.getByRole('button', { name: /previous board in series/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /next board in series/i })).not.toBeInTheDocument();
  });

  it('renders only the Next button when only a next board exists', () => {
    render(
      <BoardSeriesPager previousBoardId={null} nextBoardId="next-1" onNavigate={() => {}} />
    );
    expect(screen.getByRole('button', { name: /next board in series/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /previous board in series/i })).not.toBeInTheDocument();
  });

  it('navigates to the previous board when Previous is clicked', () => {
    const onNavigate = vi.fn();
    render(
      <BoardSeriesPager previousBoardId="prev-1" nextBoardId="next-1" onNavigate={onNavigate} />
    );
    fireEvent.click(screen.getByRole('button', { name: /previous board in series/i }));
    expect(onNavigate).toHaveBeenCalledWith('prev-1');
  });

  it('navigates to the next board when Next is clicked', () => {
    const onNavigate = vi.fn();
    render(
      <BoardSeriesPager previousBoardId="prev-1" nextBoardId="next-1" onNavigate={onNavigate} />
    );
    fireEvent.click(screen.getByRole('button', { name: /next board in series/i }));
    expect(onNavigate).toHaveBeenCalledWith('next-1');
  });
});
