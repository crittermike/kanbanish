import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import VoteLimitModal from './modals/VoteLimitModal';

describe('VoteLimitModal', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when open', () => {
    render(
      <VoteLimitModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        currentLimit={3}
      />
    );

    expect(screen.getByText('Set Vote Limit')).toBeInTheDocument();
    expect(screen.getByText('How many votes should each user be allowed to cast during the voting phase?')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <VoteLimitModal
        isOpen={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        currentLimit={3}
      />
    );

    expect(screen.queryByText('Set Vote Limit')).not.toBeInTheDocument();
  });

  it('displays the current limit in the input', () => {
    render(
      <VoteLimitModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        currentLimit={5}
      />
    );

    const input = screen.getByLabelText('Votes per user:');
    expect(input.value).toBe('5');
  });

  it('allows changing the vote limit', () => {
    render(
      <VoteLimitModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        currentLimit={3}
      />
    );

    const input = screen.getByLabelText('Votes per user:');
    fireEvent.change(input, { target: { value: '7' } });
    
    expect(input.value).toBe('7');
  });

  it('calls onConfirm with new limit and closes when confirm button is clicked', () => {
    render(
      <VoteLimitModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        currentLimit={3}
      />
    );

    const input = screen.getByLabelText('Votes per user:');
    fireEvent.change(input, { target: { value: '8' } });
    
    const confirmButton = screen.getByText('Start Voting Phase');
    fireEvent.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledWith(8);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when cancel button is clicked', () => {
    render(
      <VoteLimitModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        currentLimit={3}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('allows selecting preset values', () => {
    render(
      <VoteLimitModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        currentLimit={3}
      />
    );

    const preset5Button = screen.getByText('5');
    fireEvent.click(preset5Button);

    const input = screen.getByLabelText('Votes per user:');
    expect(input.value).toBe('5');
  });

  it('highlights the active preset button', () => {
    render(
      <VoteLimitModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        currentLimit={3}
      />
    );

    const preset3Button = screen.getByText('3');
    expect(preset3Button).toHaveClass('active');
  });

  it('limits input to valid range (1-20)', () => {
    render(
      <VoteLimitModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        currentLimit={3}
      />
    );

    const input = screen.getByLabelText('Votes per user:');
    
    // Test invalid values
    fireEvent.change(input, { target: { value: '0' } });
    expect(input.value).toBe('3'); // Should remain unchanged

    fireEvent.change(input, { target: { value: '25' } });
    expect(input.value).toBe('3'); // Should remain unchanged

    // Test valid value
    fireEvent.change(input, { target: { value: '10' } });
    expect(input.value).toBe('10'); // Should change
  });
});
