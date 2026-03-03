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

// Mock BoardContext (used by InsightsContent)
vi.mock('../context/BoardContext', () => ({
  useBoardContext: () => ({
    columns: {},
    actionItems: {},
    activeUsers: []
  })
}));

// Mock useBoardInsights (used by InsightsContent)
vi.mock('../hooks/useBoardInsights', () => ({
  useBoardInsights: () => ({
    stats: {},
    columnDistribution: [],
    themes: [],
    sentiment: {},
    topVotedCards: [],
    topVotedGroups: [],
    mostDiscussed: [],
    mostReacted: [],
    actionItemsSummary: { total: 0 },
    engagementScore: 0,
    engagementFactors: {},
    summary: '',
    isEmpty: true
  })
}));

// Mock Timer component
vi.mock('./Timer', () => ({
  default: () => <div data-testid="timer" />
}));

describe('SettingsPanel - Tab Navigation', () => {
  const defaultProps = {
    handleStartHealthCheck: vi.fn(),
    copyShareUrl: vi.fn(),
    handleExportBoard: vi.fn(),
    sortByVotes: false,
    setSortByVotes: vi.fn(),
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
    hideCardAuthorship: false,
    updateHideCardAuthorship: vi.fn(),
    showDisplayNames: false,
    updateShowDisplayNames: vi.fn(),
    votesPerUser: 0,
    updateVotesPerUser: vi.fn(),
    onOpenActionItems: vi.fn(),
    actionItemCount: 0,
    actionItemsEnabled: false,
    updateActionItemsEnabled: vi.fn(),
    backgroundId: 'none',
    setBoardBackground: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Default state and ARIA attributes', () => {
    test('renders tablist with 4 tabs', () => {
      render(<SettingsPanel {...defaultProps} />);

      const tablist = screen.getByRole('tablist', { name: 'Settings categories' });
      expect(tablist).toBeInTheDocument();

      const tabs = within(tablist).getAllByRole('tab');
      expect(tabs).toHaveLength(5);
    });

    test('defaults to Appearance tab on open', () => {
      render(<SettingsPanel {...defaultProps} />);

      const appearanceTab = screen.getByRole('tab', { name: /Appearance/i });
      expect(appearanceTab).toHaveAttribute('aria-selected', 'true');

      const votingTab = screen.getByRole('tab', { name: /Voting/i });
      expect(votingTab).toHaveAttribute('aria-selected', 'false');
    });

    test('active tab has tabIndex 0, inactive tabs have tabIndex -1', () => {
      render(<SettingsPanel {...defaultProps} />);

      const tablist = screen.getByRole('tablist', { name: 'Settings categories' });
      const tabs = within(tablist).getAllByRole('tab');
      const activeTab = tabs.find(tab => tab.getAttribute('aria-selected') === 'true');
      const inactiveTabs = tabs.filter(tab => tab.getAttribute('aria-selected') === 'false');

      expect(activeTab).toHaveAttribute('tabindex', '0');
      inactiveTabs.forEach(tab => {
        expect(tab).toHaveAttribute('tabindex', '-1');
      });
    });

    test('each tab has matching aria-controls and tabpanel id', () => {
      render(<SettingsPanel {...defaultProps} />);

      const tabIds = ['appearance', 'voting', 'features', 'share', 'insights'];
      tabIds.forEach(id => {
        const tab = document.getElementById(`settings-tab-${id}`);
        expect(tab).toBeInTheDocument();
        expect(tab).toHaveAttribute('aria-controls', `settings-tabpanel-${id}`);

        const panel = document.getElementById(`settings-tabpanel-${id}`);
        expect(panel).toBeInTheDocument();
        expect(panel).toHaveAttribute('aria-labelledby', `settings-tab-${id}`);
      });
    });

    test('each tabpanel has role="tabpanel"', () => {
      render(<SettingsPanel {...defaultProps} />);

      const panels = screen.getAllByRole('tabpanel', { hidden: true }).filter(p => p.id.startsWith('settings-tabpanel-'));
      expect(panels).toHaveLength(5);
    });

    test('only the active tabpanel is visible', () => {
      render(<SettingsPanel {...defaultProps} />);

      const activePanel = document.getElementById('settings-tabpanel-appearance');
      expect(activePanel).not.toHaveAttribute('hidden');

      const hiddenPanels = ['voting', 'features', 'share', 'insights'];
      hiddenPanels.forEach(id => {
        const panel = document.getElementById(`settings-tabpanel-${id}`);
        expect(panel).toHaveAttribute('hidden');
      });
    });
  });

  describe('Tab switching', () => {
    test('clicking a tab switches the active tab', () => {
      render(<SettingsPanel {...defaultProps} />);

      // Click Voting tab
      const votingTab = screen.getByRole('tab', { name: /Voting/i });
      fireEvent.click(votingTab);

      expect(votingTab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('tab', { name: /Appearance/i })).toHaveAttribute('aria-selected', 'false');

      // Voting panel should be visible
      expect(document.getElementById('settings-tabpanel-voting')).not.toHaveAttribute('hidden');
      expect(document.getElementById('settings-tabpanel-appearance')).toHaveAttribute('hidden');
    });

    test('clicking each tab shows the correct panel content', () => {
      render(<SettingsPanel {...defaultProps} />);

      // Appearance tab (default) - check for Theme section
      expect(screen.getByText('Theme')).toBeVisible();

      // Voting tab
      fireEvent.click(screen.getByRole('tab', { name: /Voting/i }));
      expect(screen.getByText('Allow voting')).toBeVisible();

      // Features tab
      fireEvent.click(screen.getByRole('tab', { name: /Features/i }));
      expect(screen.getByText('Retrospective mode')).toBeVisible();

      // Share & Export tab
      fireEvent.click(screen.getByRole('tab', { name: /Share/i }));
      expect(screen.getByText('Share Board')).toBeVisible();
    });

    test('resets to Appearance tab when dialog reopens', () => {
      const { rerender } = render(<SettingsPanel {...defaultProps} />);

      // Switch to Voting tab
      fireEvent.click(screen.getByRole('tab', { name: /Voting/i }));
      expect(screen.getByRole('tab', { name: /Voting/i })).toHaveAttribute('aria-selected', 'true');

      // Close dialog
      rerender(<SettingsPanel {...defaultProps} sortDropdownOpen={false} />);

      // Reopen dialog
      rerender(<SettingsPanel {...defaultProps} sortDropdownOpen={true} />);

      // Should be back on Appearance tab
      expect(screen.getByRole('tab', { name: /Appearance/i })).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Keyboard navigation', () => {
    test('ArrowRight moves to next tab', () => {
      render(<SettingsPanel {...defaultProps} />);

      const tablist = screen.getByRole('tablist', { name: 'Settings categories' });
      fireEvent.keyDown(tablist, { key: 'ArrowRight' });

      expect(screen.getByRole('tab', { name: /Voting/i })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('tab', { name: /Appearance/i })).toHaveAttribute('aria-selected', 'false');
    });

    test('ArrowLeft wraps from first to last tab', () => {
      render(<SettingsPanel {...defaultProps} />);

      // Start on Appearance (first tab), press ArrowLeft
      const tablist = screen.getByRole('tablist', { name: 'Settings categories' });
      fireEvent.keyDown(tablist, { key: 'ArrowLeft' });

      expect(screen.getByRole('tab', { name: /Insights/i })).toHaveAttribute('aria-selected', 'true');
    });

    test('ArrowRight wraps from last to first tab', () => {
      render(<SettingsPanel {...defaultProps} />);

      // Navigate to last tab first
      const tablist = screen.getByRole('tablist', { name: 'Settings categories' });
      fireEvent.click(screen.getByRole('tab', { name: /Insights/i }));

      // Press ArrowRight — should wrap to first
      fireEvent.keyDown(tablist, { key: 'ArrowRight' });
      expect(screen.getByRole('tab', { name: /Appearance/i })).toHaveAttribute('aria-selected', 'true');
    });

    test('Home key moves to first tab', () => {
      render(<SettingsPanel {...defaultProps} />);

      // Navigate to Features tab
      fireEvent.click(screen.getByRole('tab', { name: /Features/i }));

      const tablist = screen.getByRole('tablist', { name: 'Settings categories' });
      fireEvent.keyDown(tablist, { key: 'Home' });

      expect(screen.getByRole('tab', { name: /Appearance/i })).toHaveAttribute('aria-selected', 'true');
    });

    test('End key moves to last tab', () => {
      render(<SettingsPanel {...defaultProps} />);

      const tablist = screen.getByRole('tablist', { name: 'Settings categories' });
      fireEvent.keyDown(tablist, { key: 'End' });

      expect(screen.getByRole('tab', { name: /Insights/i })).toHaveAttribute('aria-selected', 'true');
    });

    test('sequential ArrowRight navigates through all tabs', () => {
      render(<SettingsPanel {...defaultProps} />);

      const tablist = screen.getByRole('tablist', { name: 'Settings categories' });
      const expectedOrder = [/Voting/i, /Features/i, /Share/i, /Insights/i, /Appearance/i];

      expectedOrder.forEach(name => {
        fireEvent.keyDown(tablist, { key: 'ArrowRight' });
        expect(screen.getByRole('tab', { name })).toHaveAttribute('aria-selected', 'true');
      });
    });
  });

  describe('Tab content isolation', () => {
    test('Appearance tab shows theme and sort options', () => {
      render(<SettingsPanel {...defaultProps} />);

      expect(screen.getByText('Theme')).toBeVisible();
      expect(screen.getByText('Sort Cards')).toBeVisible();
      expect(screen.getByText('Light')).toBeVisible();
      expect(screen.getByText('Dark')).toBeVisible();
      expect(screen.getByText('Chronological')).toBeVisible();
      expect(screen.getByText('By Votes')).toBeVisible();
    });

    test('Voting tab shows voting toggles and vote limit', () => {
      render(<SettingsPanel {...defaultProps} />);
      fireEvent.click(screen.getByRole('tab', { name: /Voting/i }));

      expect(screen.getByRole('switch', { name: 'Allow voting' })).toBeVisible();
      expect(screen.getByRole('switch', { name: 'Allow downvoting' })).toBeVisible();
      expect(screen.getByText('Votes per person')).toBeVisible();
      expect(screen.getByText('Unlimited')).toBeVisible();
    });

    test('Features tab shows feature toggles and health check', () => {
      render(<SettingsPanel {...defaultProps} />);
      fireEvent.click(screen.getByRole('tab', { name: /Features/i }));

      expect(screen.getByRole('switch', { name: 'Retrospective Mode' })).toBeVisible();
      expect(screen.getByRole('switch', { name: 'Screen sharing mode' })).toBeVisible();
      expect(screen.getByRole('switch', { name: 'Show display names on board' })).toBeVisible();
      expect(screen.getByRole('switch', { name: 'Enable action items' })).toBeVisible();
      expect(screen.getByText('Start Health Check')).toBeVisible();
    });

    test('Share tab shows share and export actions', () => {
      render(<SettingsPanel {...defaultProps} />);
      fireEvent.click(screen.getByRole('tab', { name: /Share/i }));

      expect(screen.getByText('Share Board')).toBeVisible();
      expect(screen.getByText('Export Board')).toBeVisible();
    });

    test('Share tab shows action items link when enabled', () => {
      render(<SettingsPanel {...defaultProps} actionItemsEnabled={true} actionItemCount={3} />);
      fireEvent.click(screen.getByRole('tab', { name: /Share/i }));

      const sharePanel = document.getElementById('settings-tabpanel-share');
      const actionTitles = sharePanel.querySelectorAll('.settings-share-action-title');
      const actionItemTitle = Array.from(actionTitles).find(el => el.textContent.includes('Action Items'));
      expect(actionItemTitle).toBeTruthy();
      expect(sharePanel.querySelector('.action-items-count-badge')).toHaveTextContent('3');
    });

    test('Share tab hides action items link when disabled', () => {
      render(<SettingsPanel {...defaultProps} actionItemsEnabled={false} />);
      fireEvent.click(screen.getByRole('tab', { name: /Share/i }));

      // "Action Items" text might exist in the header button area, but not in the share tab
      const sharePanel = document.getElementById('settings-tabpanel-share');
      expect(sharePanel.querySelector('.settings-share-action-title')).not.toHaveTextContent('Action Items');
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

      const overlay = document.querySelector('.modal-overlay');
      fireEvent.click(overlay);

      expect(defaultProps.setSortDropdownOpen).toHaveBeenCalledWith(false);
    });

    test('clicking inside the modal does not close it', () => {
      render(<SettingsPanel {...defaultProps} />);

      const modal = document.querySelector('.modal-container');
      fireEvent.click(modal);

      expect(defaultProps.setSortDropdownOpen).not.toHaveBeenCalled();
    });
  });
});
