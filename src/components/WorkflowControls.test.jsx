import { render, screen, fireEvent, within } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { useBoardContext } from '../context/BoardContext';
import WorkflowControls from './WorkflowControls';

vi.mock('../context/BoardContext');

describe('WorkflowControls', () => {
  const defaultContext = {
    workflowPhase: 'CREATION',
    initialWorkflowPhase: 'CREATION',
    retrospectiveMode: true,
    healthCheckVotes: {},
    votesPerUser: 3,
    updateVotesPerUser: vi.fn(),
    goToNextPhase: vi.fn(),
    goToPreviousPhase: vi.fn()
  };

  const renderWith = (overrides = {}) => {
    useBoardContext.mockReturnValue({ ...defaultContext, ...overrides });
    return render(<WorkflowControls />);
  };

  const stepLabels = () =>
    within(screen.getByRole('list')).getAllByRole('listitem').map(li => li.textContent);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('shows the retro steps without Health when there is no health check', () => {
    renderWith();
    expect(stepLabels()).toEqual(['Add', 'Group', 'Vote', 'Discuss', 'Poll']);
  });

  test('includes the Health step when the board started with a health check', () => {
    renderWith({ initialWorkflowPhase: 'HEALTH_CHECK' });
    expect(stepLabels()).toEqual(['Health', 'Add', 'Group', 'Vote', 'Discuss', 'Poll']);
  });

  test('includes the Health step when health check votes exist', () => {
    renderWith({ healthCheckVotes: { teamwork: { u1: 4 } } });
    expect(stepLabels()[0]).toBe('Health');
  });

  test('shows only the Health step for a standalone health check', () => {
    renderWith({ retrospectiveMode: false, workflowPhase: 'HEALTH_CHECK', initialWorkflowPhase: 'HEALTH_CHECK' });
    expect(stepLabels()).toEqual(['Health']);
  });

  test.each([
    ['HEALTH_CHECK', 'Health'],
    ['HEALTH_CHECK_RESULTS', 'Health'],
    ['CREATION', 'Add'],
    ['GROUPING', 'Group'],
    ['INTERACTIONS', 'Vote'],
    ['RESULTS', 'Discuss'],
    ['POLL', 'Poll'],
    ['POLL_RESULTS', 'Poll']
  ])('marks the current step for %s', (phase, label) => {
    renderWith({ workflowPhase: phase, initialWorkflowPhase: 'HEALTH_CHECK' });
    const current = screen.getByRole('listitem', { current: 'step' });
    expect(current).toHaveTextContent(label);
    expect(current).toHaveClass('workflow-step-current');
  });

  test('marks earlier steps done', () => {
    renderWith({ workflowPhase: 'INTERACTIONS' });
    expect(screen.getByText('Add').closest('li')).toHaveClass('workflow-step-done');
    expect(screen.getByText('Discuss').closest('li')).toHaveClass('workflow-step-upcoming');
  });

  test('Next calls goToNextPhase', () => {
    renderWith();
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(defaultContext.goToNextPhase).toHaveBeenCalled();
  });

  test('hides Next on the final step', () => {
    renderWith({ workflowPhase: 'POLL_RESULTS' });
    expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument();
  });

  test('hides back on the first step', () => {
    renderWith();
    expect(screen.queryByRole('button', { name: 'Previous step' })).not.toBeInTheDocument();
  });

  test('hides back on the first health step', () => {
    renderWith({ workflowPhase: 'HEALTH_CHECK', initialWorkflowPhase: 'HEALTH_CHECK' });
    expect(screen.queryByRole('button', { name: 'Previous step' })).not.toBeInTheDocument();
  });

  test('back is an icon button that calls goToPreviousPhase', () => {
    renderWith({ workflowPhase: 'GROUPING' });
    const back = screen.getByRole('button', { name: 'Previous step' });
    expect(back).toHaveTextContent('');
    fireEvent.click(back);
    expect(defaultContext.goToPreviousPhase).toHaveBeenCalled();
  });

  test('shows the votes per person select only during Vote', () => {
    renderWith({ workflowPhase: 'GROUPING' });
    expect(screen.queryByLabelText('Votes per person')).not.toBeInTheDocument();
  });

  test('changing votes per person updates the setting', () => {
    renderWith({ workflowPhase: 'INTERACTIONS' });
    const select = screen.getByLabelText('Votes per person');
    expect(select).toHaveValue('3');
    fireEvent.change(select, { target: { value: '5' } });
    expect(defaultContext.updateVotesPerUser).toHaveBeenCalledWith(5);
    fireEvent.change(select, { target: { value: '0' } });
    expect(defaultContext.updateVotesPerUser).toHaveBeenCalledWith(0);
  });

  test('keeps a custom votes per person value selectable', () => {
    renderWith({ workflowPhase: 'INTERACTIONS', votesPerUser: 25 });
    expect(screen.getByLabelText('Votes per person')).toHaveValue('25');
  });

  test('renders nothing for phases outside the stepper', () => {
    const { container } = renderWith({ workflowPhase: 'INTERACTION_REVEAL' });
    expect(container).toBeEmptyDOMElement();
  });
});
