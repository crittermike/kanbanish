import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { useBoardContext } from '../context/BoardContext';
import { WORKFLOW_PHASES } from '../utils/workflowUtils';
import StepBanner from './StepBanner';

vi.mock('../context/BoardContext', () => ({
  useBoardContext: vi.fn()
}));

const setup = (overrides = {}) => {
  const context = {
    workflowPhase: WORKFLOW_PHASES.GROUPING,
    retrospectiveMode: true,
    columns: {},
    flowStartedAt: null,
    goToPhase: vi.fn(),
    endFlow: vi.fn(),
    ...overrides
  };
  useBoardContext.mockReturnValue(context);
  const { container } = render(<StepBanner />);
  return { context, container };
};

describe('StepBanner', () => {
  test('is hidden on the plain board', () => {
    const { container } = setup({ retrospectiveMode: false, workflowPhase: WORKFLOW_PHASES.CREATION });
    expect(container).toBeEmptyDOMElement();
  });

  test('explains the step and moves back or forward', () => {
    const { context } = setup();
    expect(screen.getByText('Drag cards onto each other to group similar ones.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Back to Add' }));
    expect(context.goToPhase).toHaveBeenCalledWith(WORKFLOW_PHASES.CREATION);

    fireEvent.click(screen.getByRole('button', { name: 'Next: Vote' }));
    expect(context.goToPhase).toHaveBeenCalledWith(WORKFLOW_PHASES.INTERACTIONS);
  });

  test('has no back on the first step', () => {
    setup({ workflowPhase: WORKFLOW_PHASES.HEALTH_CHECK });
    expect(screen.queryByRole('button', { name: /Back/ })).not.toBeInTheDocument();
  });

  test('Finish on the last step ends the run', () => {
    const { context } = setup({ workflowPhase: WORKFLOW_PHASES.POLL_RESULTS });
    fireEvent.click(screen.getByRole('button', { name: 'Finish' }));
    expect(context.endFlow).toHaveBeenCalled();
  });
});
