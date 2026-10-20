import { render, screen, fireEvent, within } from '@testing-library/react';
import { vi } from 'vitest';
import { useBoardContext } from '../context/BoardContext';
import { WORKFLOW_PHASES } from '../utils/workflowUtils';
import StepSwitcher from './StepSwitcher';

vi.mock('../context/BoardContext', () => ({
  useBoardContext: vi.fn()
}));

const setup = (overrides = {}) => {
  const context = {
    workflowPhase: WORKFLOW_PHASES.CREATION,
    retrospectiveMode: false,
    columns: {},
    flowStartedAt: null,
    goToPhase: vi.fn(),
    endFlow: vi.fn(),
    ...overrides
  };
  useBoardContext.mockReturnValue(context);
  render(<StepSwitcher />);
  return context;
};

const steps = () => within(screen.getByRole('group', { name: 'Steps' }));
const current = () => steps().getAllByRole('button').find(b => b.getAttribute('aria-current') === 'step');

describe('StepSwitcher', () => {
  afterEach(() => vi.restoreAllMocks());

  test('shows Board as current when no steps are running', () => {
    setup();
    expect(steps().getAllByRole('button').map(b => b.getAttribute('aria-label') || b.textContent))
      .toEqual(['Board', 'Health', 'Add', 'Group', 'Vote', 'Discuss', 'Poll']);
    expect(current()).toHaveAccessibleName('Board');
  });

  test('picking a step goes to it', () => {
    const context = setup();
    fireEvent.click(steps().getByRole('button', { name: 'Group' }));
    expect(context.goToPhase).toHaveBeenCalledWith(WORKFLOW_PHASES.GROUPING);
  });

  test('picking Board during Add confirms before revealing this run\'s cards', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const context = setup({
      retrospectiveMode: true,
      flowStartedAt: 100,
      columns: { a: { cards: { c1: { created: 200 } } } }
    });
    expect(current()).toHaveTextContent('Add');

    fireEvent.click(steps().getByRole('button', { name: 'Board' }));
    expect(confirm).toHaveBeenCalled();
    expect(context.endFlow).not.toHaveBeenCalled();
  });

  test('a health check opened by a template shows as the current step and Board ends it', () => {
    const context = setup({ workflowPhase: WORKFLOW_PHASES.HEALTH_CHECK_RESULTS });
    expect(current()).toHaveTextContent('Health');

    fireEvent.click(steps().getByRole('button', { name: 'Board' }));
    expect(context.endFlow).toHaveBeenCalled();
  });

  describe('votes left', () => {
    const voting = (votesPerUser, used) => setup({
      retrospectiveMode: true,
      workflowPhase: WORKFLOW_PHASES.INTERACTIONS,
      votingEnabled: true,
      user: { uid: 'u1' },
      votesPerUser,
      getUserVoteCount: () => used
    });

    test('shows votes left on the Vote step', () => {
      voting(5, 2);
      expect(current()).toHaveAccessibleName('Vote, 3 votes left');
      expect(current()).toHaveTextContent('Vote · 3');
      expect(screen.getByRole('option', { name: 'Vote · 3' })).toBeInTheDocument();
    });

    test('marks the count when no votes are left', () => {
      voting(3, 3);
      expect(current()).toHaveAccessibleName('Vote, 0 votes left');
      expect(within(current()).getByText('0')).toHaveClass('depleted');
    });

    test('shows plain Vote when votes are unlimited', () => {
      voting(0, 2);
      expect(current()).toHaveAccessibleName('Vote');
      expect(current()).toHaveTextContent(/^Vote$/);
    });
  });
});
