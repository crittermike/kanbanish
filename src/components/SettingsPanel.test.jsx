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

  const openAdvanced = () => fireEvent.click(screen.getByRole('tab', { name: /Advanced/i }));

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

  describe('Tabs', () => {
    test('renders Board and Advanced tabs, Board selected by default', () => {
      render(<SettingsPanel {...defaultProps} />);

      const tablist = screen.getByRole('tablist', { name: 'Settings categories' });
      const tabs = within(tablist).getAllByRole('tab');
      expect(tabs.map(t => t.textContent)).toEqual(['Board', 'Advanced']);
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
      expect(tabs[0]).toHaveAttribute('tabindex', '0');
      expect(tabs[1]).toHaveAttribute('tabindex', '-1');
    });

    test('each tab controls its matching tabpanel', () => {
      render(<SettingsPanel {...defaultProps} />);

      ['board', 'advanced'].forEach(id => {
        const tab = document.getElementById(`settings-tab-${id}`);
        expect(tab).toHaveAttribute('aria-controls', `settings-tabpanel-${id}`);
        const panel = document.getElementById(`settings-tabpanel-${id}`);
        expect(panel).toHaveAttribute('role', 'tabpanel');
        expect(panel).toHaveAttribute('aria-labelledby', `settings-tab-${id}`);
      });
      expect(document.getElementById('settings-tabpanel-board')).not.toHaveAttribute('hidden');
      expect(document.getElementById('settings-tabpanel-advanced')).toHaveAttribute('hidden');
    });

    test('clicking a tab switches panels', () => {
      render(<SettingsPanel {...defaultProps} />);
      openAdvanced();

      expect(screen.getByRole('tab', { name: /Advanced/i })).toHaveAttribute('aria-selected', 'true');
      expect(document.getElementById('settings-tabpanel-advanced')).not.toHaveAttribute('hidden');
      expect(document.getElementById('settings-tabpanel-board')).toHaveAttribute('hidden');
    });

    test('resets to Board tab when dialog reopens', () => {
      const { rerender } = render(<SettingsPanel {...defaultProps} />);
      openAdvanced();

      rerender(<SettingsPanel {...defaultProps} sortDropdownOpen={false} />);
      rerender(<SettingsPanel {...defaultProps} sortDropdownOpen={true} />);

      expect(screen.getByRole('tab', { name: /Board/i })).toHaveAttribute('aria-selected', 'true');
    });

    test('arrow keys, Home and End move between tabs', () => {
      render(<SettingsPanel {...defaultProps} />);
      const tablist = screen.getByRole('tablist', { name: 'Settings categories' });
      const board = screen.getByRole('tab', { name: /Board/i });
      const advanced = screen.getByRole('tab', { name: /Advanced/i });

      fireEvent.keyDown(tablist, { key: 'ArrowRight' });
      expect(advanced).toHaveAttribute('aria-selected', 'true');
      fireEvent.keyDown(tablist, { key: 'ArrowRight' });
      expect(board).toHaveAttribute('aria-selected', 'true');
      fireEvent.keyDown(tablist, { key: 'ArrowLeft' });
      expect(advanced).toHaveAttribute('aria-selected', 'true');
      fireEvent.keyDown(tablist, { key: 'Home' });
      expect(board).toHaveAttribute('aria-selected', 'true');
      fireEvent.keyDown(tablist, { key: 'End' });
      expect(advanced).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Board tab', () => {
    test('shows voting, votes per person, and author visibility options', () => {
      render(<SettingsPanel {...defaultProps} />);

      expect(screen.getByRole('switch', { name: 'Allow voting' })).toBeVisible();
      expect(screen.getByText('Votes per person')).toBeVisible();
      expect(screen.getByRole('switch', { name: 'Anonymous' })).toBeVisible();
    });

    test('does not include theme, sort, share, or insights', () => {
      render(<SettingsPanel {...defaultProps} />);

      expect(screen.queryByText('Theme')).not.toBeInTheDocument();
      expect(screen.queryByText('Sort Cards')).not.toBeInTheDocument();
      expect(screen.queryByText('Share Board')).not.toBeInTheDocument();
      expect(screen.queryByRole('tab', { name: /Insights/i })).not.toBeInTheDocument();
    });

    test('Start Health Check starts the health check and closes settings', () => {
      render(<SettingsPanel {...defaultProps} retrospectiveMode={false} />);
      fireEvent.click(screen.getByRole('button', { name: 'Start Health Check' }));
      expect(defaultProps.handleStartHealthCheck).toHaveBeenCalled();
      expect(defaultProps.setSortDropdownOpen).toHaveBeenCalledWith(false);
    });

    test('hides votes per person when voting is off', () => {
      render(<SettingsPanel {...defaultProps} votingEnabled={false} />);
      expect(screen.queryByText('Votes per person')).not.toBeInTheDocument();
    });

    test('toggling voting calls updateVotingEnabled', () => {
      render(<SettingsPanel {...defaultProps} />);
      fireEvent.click(screen.getByRole('switch', { name: 'Allow voting' }));
      expect(defaultProps.updateVotingEnabled).toHaveBeenCalledWith(false);
    });
  });

  describe('Retrospective mode', () => {
    test('hides Allow voting but keeps vote settings', () => {
      render(<SettingsPanel {...defaultProps} votingEnabled={false} retrospectiveMode={true} />);

      expect(screen.queryByRole('switch', { name: 'Allow voting' })).not.toBeInTheDocument();
      expect(screen.getByText('Votes per person')).toBeVisible();

      openAdvanced();
      expect(screen.getByRole('switch', { name: 'Allow downvoting' })).toBeVisible();
    });

    test('toggle lives in Advanced with an accurate hint', () => {
      render(<SettingsPanel {...defaultProps} />);
      openAdvanced();

      fireEvent.click(screen.getByRole('switch', { name: 'Retrospective mode' }));
      expect(defaultProps.updateRetrospectiveMode).toHaveBeenCalledWith(true);
      expect(screen.getByText('Guided steps: add cards, group, vote, discuss')).toBeVisible();
      expect(screen.queryByText(/hidden text until revealed/i)).not.toBeInTheDocument();
    });
  });

  describe('Advanced tab', () => {
    test('shows voting rules, background, and board actions', () => {
      render(<SettingsPanel {...defaultProps} />);
      openAdvanced();

      expect(screen.getByRole('switch', { name: 'Allow downvoting' })).toBeVisible();
      expect(screen.getByRole('switch', { name: 'Allow users to vote multiple times on the same card' })).toBeVisible();
      expect(screen.getByText('Board Background')).toBeVisible();
      expect(screen.getByRole('button', { name: 'Export board' })).toBeVisible();
      expect(screen.getByRole('button', { name: 'Start next board' })).toBeVisible();
      expect(screen.getByRole('button', { name: 'Link to previous board' })).toBeVisible();
      expect(screen.getByRole('button', { name: 'Reset all votes' })).toBeVisible();
      expect(screen.queryByRole('button', { name: 'Remove from series' })).not.toBeInTheDocument();
    });

    test('hides voting rules and reset when voting is off', () => {
      render(<SettingsPanel {...defaultProps} votingEnabled={false} />);
      openAdvanced();

      expect(screen.queryByRole('switch', { name: 'Allow downvoting' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Reset all votes' })).not.toBeInTheDocument();
    });

    test('shows Remove from series when board is linked', () => {
      render(<SettingsPanel {...defaultProps} previousBoardId="prev" />);
      openAdvanced();

      fireEvent.click(screen.getByRole('button', { name: 'Remove from series' }));
      expect(defaultProps.onUnlinkSeries).toHaveBeenCalled();
    });

    test('Export board closes the dialog and opens export', () => {
      render(<SettingsPanel {...defaultProps} />);
      openAdvanced();

      fireEvent.click(screen.getByRole('button', { name: 'Export board' }));
      expect(defaultProps.setSortDropdownOpen).toHaveBeenCalledWith(false);
      expect(defaultProps.handleExportBoard).toHaveBeenCalled();
    });
  });

  describe('Dialog interactions', () => {
    test('does not render tab content when dialog is closed', () => {
      render(<SettingsPanel {...defaultProps} sortDropdownOpen={false} />);

      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
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
