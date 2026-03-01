import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BoardSetupWizard from './BoardSetupWizard';

// Mock the CSS import
vi.mock('../../styles/components/wizard.css', () => ({}));

// Mock useFocusTrap
vi.mock('../../hooks/useFocusTrap', () => ({
  useFocusTrap: vi.fn()
}));

describe('BoardSetupWizard', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering tests', () => {
    it('does not render when isOpen is false', () => {
      render(
        <BoardSetupWizard
          isOpen={false}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          templateName="Test Template"
        />
      );

      expect(screen.queryByText('Set Up Your Board')).not.toBeInTheDocument();
    });

    it('renders the modal when isOpen is true', () => {
      render(
        <BoardSetupWizard
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          templateName="Test Template"
        />
      );

      expect(screen.getByText('Set Up Your Board')).toBeInTheDocument();
    });

    it('shows the template name in the header', () => {
      render(
        <BoardSetupWizard
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          templateName="Lean Coffee"
        />
      );

      expect(screen.getByText('Template: Lean Coffee')).toBeInTheDocument();
    });

    it('shows "Set Up Your Board" as the title', () => {
      render(
        <BoardSetupWizard
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          templateName="Test"
        />
      );

      expect(screen.getByText('Set Up Your Board')).toBeInTheDocument();
    });

    it('shows default settings: Kanban Mode selected, voting ON, display names OFF, action items OFF', () => {
      render(
        <BoardSetupWizard
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          templateName="Test"
        />
      );

      // Check Kanban Mode is selected
      const kanbanButton = screen.getByRole('radio', { name: /Kanban Mode/i });
      expect(kanbanButton).toHaveAttribute('aria-checked', 'true');

      // Check Retrospective Mode is not selected
      const retroButton = screen.getByRole('radio', { name: /Retrospective Mode/i });
      expect(retroButton).toHaveAttribute('aria-checked', 'false');

      // Check voting is enabled
      const votingSwitch = screen.getByRole('switch', { name: /Allow Voting/i });
      expect(votingSwitch).toHaveAttribute('aria-checked', 'true');

      // Check display names is disabled
      const namesSwitch = screen.getByRole('switch', { name: /Show Display Names/i });
      expect(namesSwitch).toHaveAttribute('aria-checked', 'false');

      // Check action items is disabled
      const actionItemsSwitch = screen.getByRole('switch', { name: /Enable Action Items/i });
      expect(actionItemsSwitch).toHaveAttribute('aria-checked', 'false');
    });

    it('health check toggle is hidden when Kanban mode is selected', () => {
      render(
        <BoardSetupWizard
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          templateName="Test"
        />
      );

      const healthCheckWrapper = screen.getByText('Start with Health Check').closest('div').parentElement.parentElement;
      expect(healthCheckWrapper).toHaveAttribute('aria-hidden', 'true');
    });

    it('defaults to Retrospective Mode when template has retro-related tags', () => {
      render(
        <BoardSetupWizard
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          templateName="Retrospective"
          templateTags={['agile', 'reflection', 'team']}
        />
      );

      const retroButton = screen.getByRole('radio', { name: /Retrospective Mode/i });
      expect(retroButton).toHaveAttribute('aria-checked', 'true');

      const kanbanButton = screen.getByRole('radio', { name: /Kanban Mode/i });
      expect(kanbanButton).toHaveAttribute('aria-checked', 'false');

      // Health check should be visible
      const healthCheckWrapper = screen.getByText('Start with Health Check').closest('div').parentElement.parentElement;
      expect(healthCheckWrapper).toHaveAttribute('aria-hidden', 'false');
    });

    it('defaults to Kanban Mode when template has no retro-related tags', () => {
      render(
        <BoardSetupWizard
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          templateName="Default"
          templateTags={['workflow', 'kanban', 'basic']}
        />
      );

      const kanbanButton = screen.getByRole('radio', { name: /Kanban Mode/i });
      expect(kanbanButton).toHaveAttribute('aria-checked', 'true');

      const retroButton = screen.getByRole('radio', { name: /Retrospective Mode/i });
      expect(retroButton).toHaveAttribute('aria-checked', 'false');
    });
  });

  describe('Interaction tests', () => {
    it('clicking "Retrospective Mode" button selects it (and deselects Kanban Mode)', () => {
      render(
        <BoardSetupWizard
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          templateName="Test"
        />
      );

      const retroButton = screen.getByRole('radio', { name: /Retrospective Mode/i });
      fireEvent.click(retroButton);

      expect(retroButton).toHaveAttribute('aria-checked', 'true');

      const kanbanButton = screen.getByRole('radio', { name: /Kanban Mode/i });
      expect(kanbanButton).toHaveAttribute('aria-checked', 'false');
    });

    it('clicking "Kanban Mode" button selects it back', () => {
      render(
        <BoardSetupWizard
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          templateName="Test"
        />
      );

      const retroButton = screen.getByRole('radio', { name: /Retrospective Mode/i });
      fireEvent.click(retroButton);

      const kanbanButton = screen.getByRole('radio', { name: /Kanban Mode/i });
      fireEvent.click(kanbanButton);

      expect(kanbanButton).toHaveAttribute('aria-checked', 'true');
      expect(retroButton).toHaveAttribute('aria-checked', 'false');
    });

    it('when Retrospective Mode is selected, health check toggle appears', () => {
      render(
        <BoardSetupWizard
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          templateName="Test"
        />
      );

      const retroButton = screen.getByRole('radio', { name: /Retrospective Mode/i });
      fireEvent.click(retroButton);

      const healthCheckWrapper = screen.getByText('Start with Health Check').closest('div').parentElement.parentElement;
      expect(healthCheckWrapper).toHaveAttribute('aria-hidden', 'false');
    });

    it('toggle switches work: clicking Allow Voting toggle turns it off', () => {
      render(
        <BoardSetupWizard
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          templateName="Test"
        />
      );

      const votingSwitch = screen.getByRole('switch', { name: /Allow Voting/i });
      expect(votingSwitch).toHaveAttribute('aria-checked', 'true');

      fireEvent.click(votingSwitch);

      expect(votingSwitch).toHaveAttribute('aria-checked', 'false');
    });

    it('toggle switches work: clicking Show Display Names toggle turns it on', () => {
      render(
        <BoardSetupWizard
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          templateName="Test"
        />
      );

      const namesSwitch = screen.getByRole('switch', { name: /Show Display Names/i });
      expect(namesSwitch).toHaveAttribute('aria-checked', 'false');

      fireEvent.click(namesSwitch);

      expect(namesSwitch).toHaveAttribute('aria-checked', 'true');
    });

    it('toggle switches work: clicking Enable Action Items toggle turns it on', () => {
      render(
        <BoardSetupWizard
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          templateName="Test"
        />
      );

      const actionItemsSwitch = screen.getByRole('switch', { name: /Enable Action Items/i });
      expect(actionItemsSwitch).toHaveAttribute('aria-checked', 'false');

      fireEvent.click(actionItemsSwitch);

      expect(actionItemsSwitch).toHaveAttribute('aria-checked', 'true');
    });

    it('when health check is visible, clicking it toggles it on', () => {
      render(
        <BoardSetupWizard
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          templateName="Test"
        />
      );

      const retroButton = screen.getByRole('radio', { name: /Retrospective Mode/i });
      fireEvent.click(retroButton);

      const healthCheckSwitch = screen.getByRole('switch', { name: /Start with Health Check/i });
      expect(healthCheckSwitch).toHaveAttribute('aria-checked', 'false');

      fireEvent.click(healthCheckSwitch);

      expect(healthCheckSwitch).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('Callback tests', () => {
    it('clicking "Create Board" calls onConfirm with default settings', () => {
      render(
        <BoardSetupWizard
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          templateName="Test"
        />
      );

      const createButton = screen.getByText('Create Board');
      fireEvent.click(createButton);

      expect(mockOnConfirm).toHaveBeenCalledWith({
        retrospectiveMode: false,
        votingEnabled: true,
        showDisplayNames: false,
        actionItemsEnabled: false,
        startHealthCheck: false
      });
    });

    it('clicking "Create Board" after changing settings calls onConfirm with updated settings', () => {
      render(
        <BoardSetupWizard
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          templateName="Test"
        />
      );

      // Change voting to off
      const votingSwitch = screen.getByRole('switch', { name: /Allow Voting/i });
      fireEvent.click(votingSwitch);

      // Change display names to on
      const namesSwitch = screen.getByRole('switch', { name: /Show Display Names/i });
      fireEvent.click(namesSwitch);

      // Change action items to on
      const actionItemsSwitch = screen.getByRole('switch', { name: /Enable Action Items/i });
      fireEvent.click(actionItemsSwitch);

      const createButton = screen.getByText('Create Board');
      fireEvent.click(createButton);

      expect(mockOnConfirm).toHaveBeenCalledWith({
        retrospectiveMode: false,
        votingEnabled: false,
        showDisplayNames: true,
        actionItemsEnabled: true,
        startHealthCheck: false
      });
    });

    it('clicking "Back" calls onClose', () => {
      render(
        <BoardSetupWizard
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          templateName="Test"
        />
      );

      const backButton = screen.getByText('Back');
      fireEvent.click(backButton);

      expect(mockOnClose).toHaveBeenCalled();
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('clicking close button (×) calls onClose', () => {
      render(
        <BoardSetupWizard
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          templateName="Test"
        />
      );

      const closeButton = screen.getByLabelText('Close setup wizard');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('health check is always false when Kanban mode is active, even if previously toggled', () => {
      render(
        <BoardSetupWizard
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          templateName="Test"
        />
      );

      // Switch to retrospective mode
      const retroButton = screen.getByRole('radio', { name: /Retrospective Mode/i });
      fireEvent.click(retroButton);

      // Toggle health check on
      const healthCheckSwitch = screen.getByRole('switch', { name: /Start with Health Check/i });
      fireEvent.click(healthCheckSwitch);

      // Switch back to Kanban mode
      const kanbanButton = screen.getByRole('radio', { name: /Kanban Mode/i });
      fireEvent.click(kanbanButton);

      // Create board with Kanban mode
      const createButton = screen.getByText('Create Board');
      fireEvent.click(createButton);

      // Health check should be false even though it was toggled on
      expect(mockOnConfirm).toHaveBeenCalledWith({
        retrospectiveMode: false,
        votingEnabled: true,
        showDisplayNames: false,
        actionItemsEnabled: false,
        startHealthCheck: false
      });
    });
  });

  describe('State reset tests', () => {
    it('settings reset when modal reopens (toggle settings, close, reopen → defaults again)', () => {
      const { rerender } = render(
        <BoardSetupWizard
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          templateName="Test"
        />
      );

      // Change voting to off
      const votingSwitch = screen.getByRole('switch', { name: /Allow Voting/i });
      fireEvent.click(votingSwitch);
      expect(votingSwitch).toHaveAttribute('aria-checked', 'false');

      // Close the modal
      rerender(
        <BoardSetupWizard
          isOpen={false}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          templateName="Test"
        />
      );

      // Reopen the modal
      rerender(
        <BoardSetupWizard
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          templateName="Test"
        />
      );

      // Check that voting is back to on (default)
      const newVotingSwitch = screen.getByRole('switch', { name: /Allow Voting/i });
      expect(newVotingSwitch).toHaveAttribute('aria-checked', 'true');

      // Verify all other settings are also reset to defaults
      const kanbanButton = screen.getByRole('radio', { name: /Kanban Mode/i });
      expect(kanbanButton).toHaveAttribute('aria-checked', 'true');

      const namesSwitch = screen.getByRole('switch', { name: /Show Display Names/i });
      expect(namesSwitch).toHaveAttribute('aria-checked', 'false');

      const actionItemsSwitch = screen.getByRole('switch', { name: /Enable Action Items/i });
      expect(actionItemsSwitch).toHaveAttribute('aria-checked', 'false');
    });
  });
});
