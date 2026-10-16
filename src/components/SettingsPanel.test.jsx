import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, test, beforeEach, expect } from 'vitest';
import SettingsPanel from './SettingsPanel';

// Mock NotificationContext
vi.mock('../context/NotificationContext', () => ({
  useNotification: () => ({
    showNotification: vi.fn(),
    notification: { message: '', show: false }
  })
}));

// Mock Timer component
vi.mock('./Timer', () => ({
  default: () => <div data-testid="timer" />
}));

describe('SettingsPanel', () => {
  const defaultProps = {
    handleStartHealthCheck: vi.fn(),
    copyShareUrl: vi.fn(),
    handleExportBoard: vi.fn(),
    votingEnabled: true,
    updateVotingEnabled: vi.fn(),
    downvotingEnabled: true,
    updateDownvotingEnabled: vi.fn(),
    multipleVotesAllowed: false,
    updateMultipleVotesAllowed: vi.fn(),
    retrospectiveMode: false,
    updateRetrospectiveMode: vi.fn(),
    sortDropdownOpen: true,
    setSortDropdownOpen: vi.fn(),
    resetAllVotes: vi.fn(),
    darkMode: true,
    updateDarkMode: vi.fn(),
    showDisplayNames: false,
    updateShowDisplayNames: vi.fn(),
    votesPerUser: 0,
    updateVotesPerUser: vi.fn(),
    backgroundId: 'none',
    setBoardBackground: vi.fn(),
    onStartNextBoard: vi.fn(),
    onOpenLinkPrevious: vi.fn(),
    onUnlinkSeries: vi.fn(),
  };

  const openActions = () => fireEvent.click(screen.getByRole('button', { name: 'Board actions' }));

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Header buttons', () => {
    test('share button copies the board link', () => {
      render(<SettingsPanel {...defaultProps} sortDropdownOpen={false} />);
      fireEvent.click(screen.getByRole('button', { name: 'Share board' }));
      expect(defaultProps.copyShareUrl).toHaveBeenCalled();
    });

    test('theme button toggles dark mode', () => {
      const { rerender } = render(<SettingsPanel {...defaultProps} sortDropdownOpen={false} />);
      fireEvent.click(screen.getByRole('button', { name: 'Switch to light theme' }));
      expect(defaultProps.updateDarkMode).toHaveBeenCalledWith(false);

      rerender(<SettingsPanel {...defaultProps} sortDropdownOpen={false} darkMode={false} />);
      fireEvent.click(screen.getByRole('button', { name: 'Switch to dark theme' }));
      expect(defaultProps.updateDarkMode).toHaveBeenCalledWith(true);
    });
  });

  describe('Settings dialog', () => {
    test('groups preferences under Voting and Board with no tabs', () => {
      render(<SettingsPanel {...defaultProps} />);

      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
      const voting = screen.getByRole('region', { name: 'Voting' });
      const board = screen.getByRole('region', { name: 'Board' });

      expect(within(voting).getByRole('switch', { name: 'Allow voting' })).toBeVisible();
      expect(within(voting).getByText('Votes per person')).toBeVisible();
      expect(within(voting).getByRole('switch', { name: 'Allow downvoting' })).toBeVisible();
      expect(within(voting).getByRole('switch', { name: 'Allow users to vote multiple times on the same card' })).toBeVisible();

      expect(within(board).getByRole('switch', { name: 'Anonymous' })).toBeVisible();
      expect(within(board).getByRole('switch', { name: 'Retrospective mode' })).toBeVisible();
      expect(within(board).getByRole('switch', { name: 'Custom background' })).toBeVisible();
    });

    test('holds preferences only, no one-off actions', () => {
      render(<SettingsPanel {...defaultProps} />);
      const dialog = screen.getByRole('dialog');

      for (const name of ['Start health check', 'Export board', 'Start next board', 'Link to previous board', 'Reset all votes']) {
        expect(within(dialog).queryByRole('button', { name })).not.toBeInTheDocument();
      }
      expect(within(dialog).queryByText('Theme')).not.toBeInTheDocument();
      expect(within(dialog).queryByText(/sort/i)).not.toBeInTheDocument();
    });

    test('hides vote rules when voting is off', () => {
      render(<SettingsPanel {...defaultProps} votingEnabled={false} />);
      expect(screen.queryByText('Votes per person')).not.toBeInTheDocument();
      expect(screen.queryByRole('switch', { name: 'Allow downvoting' })).not.toBeInTheDocument();
    });

    test('toggling voting calls updateVotingEnabled', () => {
      render(<SettingsPanel {...defaultProps} />);
      fireEvent.click(screen.getByRole('switch', { name: 'Allow voting' }));
      expect(defaultProps.updateVotingEnabled).toHaveBeenCalledWith(false);
    });

    test('Anonymous is the inverse of display names', () => {
      render(<SettingsPanel {...defaultProps} showDisplayNames={true} />);
      const anonymous = screen.getByRole('switch', { name: 'Anonymous' });
      expect(anonymous).toHaveAttribute('aria-checked', 'false');
      fireEvent.click(anonymous);
      expect(defaultProps.updateShowDisplayNames).toHaveBeenCalledWith(false);
    });
  });

  describe('Retrospective mode', () => {
    test('hides Allow voting but keeps vote rules', () => {
      render(<SettingsPanel {...defaultProps} votingEnabled={false} retrospectiveMode={true} />);

      expect(screen.queryByRole('switch', { name: 'Allow voting' })).not.toBeInTheDocument();
      expect(screen.getByText('Votes per person')).toBeVisible();
      expect(screen.getByRole('switch', { name: 'Allow downvoting' })).toBeVisible();
    });

    test('toggle has an accurate hint', () => {
      render(<SettingsPanel {...defaultProps} />);

      fireEvent.click(screen.getByRole('switch', { name: 'Retrospective mode' }));
      expect(defaultProps.updateRetrospectiveMode).toHaveBeenCalledWith(true);
      expect(screen.getByText('Guided steps: add cards, group, vote, discuss')).toBeVisible();
      expect(screen.queryByText(/hidden text until revealed/i)).not.toBeInTheDocument();
    });
  });

  describe('Custom background', () => {
    test('is off with no picker when the board uses the default background', () => {
      render(<SettingsPanel {...defaultProps} backgroundId="none" />);

      expect(screen.getByRole('switch', { name: 'Custom background' })).toHaveAttribute('aria-checked', 'false');
      expect(screen.queryByRole('tablist', { name: 'Background categories' })).not.toBeInTheDocument();
    });

    test('turning it on reveals the picker without changing the background', () => {
      render(<SettingsPanel {...defaultProps} backgroundId="none" />);

      fireEvent.click(screen.getByRole('switch', { name: 'Custom background' }));
      expect(screen.getByRole('tablist', { name: 'Background categories' })).toBeVisible();
      expect(screen.queryByRole('button', { name: /^Default/ })).not.toBeInTheDocument();
      expect(defaultProps.setBoardBackground).not.toHaveBeenCalled();
    });

    test('is on with the picker shown when the board has a background', () => {
      render(<SettingsPanel {...defaultProps} backgroundId="slate" />);

      expect(screen.getByRole('switch', { name: 'Custom background' })).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByRole('button', { name: 'Slate (selected)' })).toBeVisible();
    });

    test('turning it off restores the default background', () => {
      render(<SettingsPanel {...defaultProps} backgroundId="slate" />);

      fireEvent.click(screen.getByRole('switch', { name: 'Custom background' }));
      expect(defaultProps.setBoardBackground).toHaveBeenCalledWith('none');
      expect(screen.queryByRole('tablist', { name: 'Background categories' })).not.toBeInTheDocument();
    });
  });

  describe('Board actions menu', () => {
    test('is closed until the button is clicked', () => {
      render(<SettingsPanel {...defaultProps} sortDropdownOpen={false} />);
      const button = screen.getByRole('button', { name: 'Board actions' });

      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();

      openActions();
      expect(button).toHaveAttribute('aria-expanded', 'true');
      const menu = screen.getByRole('menu', { name: 'Board actions' });
      expect(within(menu).getAllByRole('menuitem').map(i => i.textContent)).toEqual([
        'Start health check',
        'Export board',
        'Start next board',
        'Link to previous board',
        'Reset all votes',
      ]);
    });

    test('Start health check works outside retrospective mode', () => {
      render(<SettingsPanel {...defaultProps} sortDropdownOpen={false} retrospectiveMode={false} />);
      openActions();
      fireEvent.click(screen.getByRole('menuitem', { name: 'Start health check' }));

      expect(defaultProps.handleStartHealthCheck).toHaveBeenCalled();
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    test('Start health check is available in retrospective mode', () => {
      render(<SettingsPanel {...defaultProps} sortDropdownOpen={false} retrospectiveMode={true} />);
      openActions();
      expect(screen.getByRole('menuitem', { name: 'Start health check' })).toBeVisible();
    });

    test('runs export, series, and reset actions', () => {
      render(<SettingsPanel {...defaultProps} sortDropdownOpen={false} previousBoardId="prev" />);

      const actions = [
        ['Export board', defaultProps.handleExportBoard],
        ['Start next board', defaultProps.onStartNextBoard],
        ['Link to previous board', defaultProps.onOpenLinkPrevious],
        ['Remove from series', defaultProps.onUnlinkSeries],
        ['Reset all votes', defaultProps.resetAllVotes],
      ];
      for (const [name, handler] of actions) {
        openActions();
        fireEvent.click(screen.getByRole('menuitem', { name }));
        expect(handler).toHaveBeenCalled();
      }
    });

    test('hides Remove from series when the board is not linked', () => {
      render(<SettingsPanel {...defaultProps} sortDropdownOpen={false} />);
      openActions();
      expect(screen.queryByRole('menuitem', { name: 'Remove from series' })).not.toBeInTheDocument();
    });

    test('hides Reset all votes when voting is off', () => {
      render(<SettingsPanel {...defaultProps} sortDropdownOpen={false} votingEnabled={false} />);
      openActions();
      expect(screen.queryByRole('menuitem', { name: 'Reset all votes' })).not.toBeInTheDocument();
    });

    test('Escape closes the menu and returns focus to the button', () => {
      render(<SettingsPanel {...defaultProps} sortDropdownOpen={false} />);
      openActions();
      expect(screen.getByRole('menuitem', { name: 'Start health check' })).toHaveFocus();

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Board actions' })).toHaveFocus();
    });

    test('arrow keys move between items', () => {
      render(<SettingsPanel {...defaultProps} sortDropdownOpen={false} />);
      openActions();
      const menu = screen.getByRole('menu');

      fireEvent.keyDown(menu, { key: 'ArrowDown' });
      expect(screen.getByRole('menuitem', { name: 'Export board' })).toHaveFocus();
      fireEvent.keyDown(menu, { key: 'End' });
      expect(screen.getByRole('menuitem', { name: 'Reset all votes' })).toHaveFocus();
      fireEvent.keyDown(menu, { key: 'ArrowDown' });
      expect(screen.getByRole('menuitem', { name: 'Start health check' })).toHaveFocus();
    });

    test('clicking outside closes the menu', () => {
      render(<SettingsPanel {...defaultProps} sortDropdownOpen={false} />);
      openActions();
      fireEvent.mouseDown(document.body);
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  describe('Dialog interactions', () => {
    test('does not render the dialog when closed', () => {
      render(<SettingsPanel {...defaultProps} sortDropdownOpen={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('Escape key closes the dialog', () => {
      render(<SettingsPanel {...defaultProps} />);
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(defaultProps.setSortDropdownOpen).toHaveBeenCalledWith(false);
    });

    test('clicking overlay closes the dialog', () => {
      render(<SettingsPanel {...defaultProps} />);
      fireEvent.click(document.querySelector('.modal-overlay'));
      expect(defaultProps.setSortDropdownOpen).toHaveBeenCalledWith(false);
    });

    test('clicking inside the modal does not close it', () => {
      render(<SettingsPanel {...defaultProps} />);
      fireEvent.click(document.querySelector('.modal-container'));
      expect(defaultProps.setSortDropdownOpen).not.toHaveBeenCalled();
    });
  });
});
