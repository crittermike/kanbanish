import { fireEvent, render, screen } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { useBoardContext } from '../context/BoardContext';
import FlowStartButton from './FlowStartButton';

vi.mock('../context/BoardContext');

describe('FlowStartButton', () => {
  const context = {
    startFlow: vi.fn(),
    flowHealthCheck: false,
    flowPoll: true,
    updateFlowHealthCheck: vi.fn(),
    updateFlowPoll: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useBoardContext.mockReturnValue(context);
  });

  test('▶ starts the steps, labelled by the steps it will run', () => {
    render(<FlowStartButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Start: add, group, vote, discuss, poll' }));
    expect(context.startFlow).toHaveBeenCalled();
  });

  test('the caret toggles the optional steps without starting', () => {
    render(<FlowStartButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Step options' }));

    const poll = screen.getByRole('menuitemcheckbox', { name: 'Poll' });
    expect(poll).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(poll);
    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Health check' }));

    expect(context.updateFlowPoll).toHaveBeenCalledWith(false);
    expect(context.updateFlowHealthCheck).toHaveBeenCalledWith(true);
    expect(context.startFlow).not.toHaveBeenCalled();
  });
});
