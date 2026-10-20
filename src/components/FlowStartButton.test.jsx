import { fireEvent, render, screen, within } from '@testing-library/react';
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

  const open = () => {
    render(<FlowStartButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Start: add, group, vote, discuss' }));
    return screen.getByRole('dialog');
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useBoardContext.mockReturnValue(context);
  });

  test('▶ opens a dialog listing the steps without starting', () => {
    const dialog = open();
    const steps = within(dialog).getAllByRole('listitem').map(li => li.textContent);
    expect(steps).toEqual(['Health check', 'Add', 'Group', 'Vote', 'Discuss', 'Poll']);
    expect(context.startFlow).not.toHaveBeenCalled();
  });

  test('switches toggle the optional steps', () => {
    const dialog = open();
    const poll = within(dialog).getByRole('switch', { name: 'Poll' });
    expect(poll).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(poll);
    fireEvent.click(within(dialog).getByRole('switch', { name: 'Health check' }));

    expect(context.updateFlowPoll).toHaveBeenCalledWith(false);
    expect(context.updateFlowHealthCheck).toHaveBeenCalledWith(true);
    expect(context.startFlow).not.toHaveBeenCalled();
  });

  test('Start starts the steps and closes the dialog', () => {
    const dialog = open();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Start' }));
    expect(context.startFlow).toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
