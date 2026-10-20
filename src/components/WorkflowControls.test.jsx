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
    goToPreviousPhase: vi.fn(),
    endFlow: vi.fn(),
    columns: {}
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

  test('shows Add, Group, Vote, Discuss by default', () => {
    renderWith();
    expect(screen.getByRole('navigation', { name: 'Steps' })).toBeInTheDocument();
    expect(stepLabels()).toEqual(['Add', 'Group', 'Vote', 'Discuss']);
  });

  test('includes the optional Health and Poll steps when enabled', () => {
    renderWith({ flowStartedAt: 1, flowHealthCheck: true, flowPoll: true });
    expect(stepLabels()).toEqual(['Health', 'Add', 'Group', 'Vote', 'Discuss', 'Poll']);
  });

  test('ignores a past health check once a run has started without one', () => {
    renderWith({ flowStartedAt: 1, initialWorkflowPhase: 'HEALTH_CHECK' });
    expect(stepLabels()[0]).toBe('Add');
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
    renderWith({ workflowPhase: phase, initialWorkflowPhase: 'HEALTH_CHECK', flowPoll: true });
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

  test.each([
    ['HEALTH_CHECK', { flowHealthCheck: true }],
    ['POLL', { flowPoll: true }]
  ])('%s labels Next as Results', (phase, overrides) => {
    renderWith({ workflowPhase: phase, ...overrides });
    expect(screen.getByRole('button', { name: /results/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument();
  });

  test.each([
    ['RESULTS', {}],
    ['POLL_RESULTS', { flowPoll: true }]
  ])('the last step (%s) shows Done instead of Next and End', (phase, overrides) => {
    renderWith({ workflowPhase: phase, ...overrides });
    expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'End' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /done/i }));
    expect(defaultContext.goToNextPhase).toHaveBeenCalled();
  });

  test('End ends the run', () => {
    renderWith({ workflowPhase: 'GROUPING' });
    fireEvent.click(screen.getByRole('button', { name: 'End' }));
    expect(defaultContext.endFlow).toHaveBeenCalled();
  });

  test('End during Add asks before revealing this run\'s hidden cards', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderWith({
      flowStartedAt: 500,
      columns: { col: { cards: { old: { created: 100 }, fresh: { created: 600 } } } }
    });
    fireEvent.click(screen.getByRole('button', { name: 'End' }));
    expect(confirm).toHaveBeenCalled();
    expect(defaultContext.endFlow).not.toHaveBeenCalled();
    confirm.mockRestore();
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
