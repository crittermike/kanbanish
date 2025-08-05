import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import BaseVoteCounter from './BaseVoteCounter';

describe('BaseVoteCounter', () => {
  it('renders with basic props', () => {
    render(
      <BaseVoteCounter
        className="test-counter"
        label="Test label:"
        value={5}
        total={10}
      />
    );

    expect(screen.getByText('Test label:')).toBeInTheDocument();
    expect(screen.getByText('5/10')).toBeInTheDocument();
  });

  it('renders without total value', () => {
    render(
      <BaseVoteCounter
        className="test-counter"
        label="Test label:"
        value={5}
      />
    );

    expect(screen.getByText('Test label:')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('applies depleted class when isDepleted is true', () => {
    render(
      <BaseVoteCounter
        className="test-counter"
        label="Test label:"
        value={0}
        total={10}
        isDepleted={true}
      />
    );

    const valueElement = screen.getByText('0/10');
    expect(valueElement).toHaveClass('test-counter-depleted');
  });

  it('does not apply depleted class when isDepleted is false', () => {
    render(
      <BaseVoteCounter
        className="test-counter"
        label="Test label:"
        value={5}
        total={10}
        isDepleted={false}
      />
    );

    const valueElement = screen.getByText('5/10');
    expect(valueElement).not.toHaveClass('test-counter-depleted');
  });

  it('applies correct CSS classes', () => {
    render(
      <BaseVoteCounter
        className="custom-counter"
        label="Custom label:"
        value={3}
        total={5}
      />
    );

    expect(screen.getByText('Custom label:')).toHaveClass('custom-counter-label');
    expect(screen.getByText('3/5')).toHaveClass('custom-counter-value');
    
    // The outer container should have the base className
    const container = screen.getByText('Custom label:').closest('.custom-counter');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('custom-counter');
    
    const contentContainer = screen.getByText('Custom label:').parentElement;
    expect(contentContainer).toHaveClass('custom-counter-content');
  });

  it('sets test id when provided', () => {
    render(
      <BaseVoteCounter
        className="test-counter"
        label="Test label:"
        value={5}
        testId="vote-counter-test"
      />
    );

    expect(screen.getByTestId('vote-counter-test')).toBeInTheDocument();
  });
});
