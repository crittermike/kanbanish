import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { useBoardContext } from '../context/BoardContext';
import HealthCheckResults from './HealthCheckResults';

// Mock the BoardContext
vi.mock('../context/BoardContext', () => ({
  useBoardContext: vi.fn()
}));

describe('HealthCheckResults Component', () => {
  const mockGetHealthCheckStats = vi.fn();

  const defaultMockContext = {
    getHealthCheckStats: mockGetHealthCheckStats,
    healthCheckVotes: {},
    resetHealthCheck: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useBoardContext.mockReturnValue(defaultMockContext);
  });

  test('shows "no votes" message when all questions have 0 total votes', () => {
    mockGetHealthCheckStats.mockReturnValue([
      {
        id: 'teamwork',
        label: 'Teamwork',
        description: 'How well is the team collaborating?',
        average: 0,
        distribution: [0, 0, 0, 0, 0],
        totalVotes: 0
      },
      {
        id: 'fun',
        label: 'Fun',
        description: 'How much fun are we having at work?',
        average: 0,
        distribution: [0, 0, 0, 0, 0],
        totalVotes: 0
      }
    ]);

    render(<HealthCheckResults />);

    expect(screen.getByText('No votes yet')).toBeInTheDocument();
    expect(screen.queryByTestId('health-result-teamwork')).not.toBeInTheDocument();
  });

  test('shows results with correct averages when votes exist', () => {
    mockGetHealthCheckStats.mockReturnValue([
      {
        id: 'teamwork',
        label: 'Teamwork',
        description: 'How well is the team collaborating?',
        average: 4.2,
        distribution: [0, 0, 1, 2, 2],
        totalVotes: 5
      },
      {
        id: 'fun',
        label: 'Fun',
        description: 'How much fun are we having at work?',
        average: 3.6,
        distribution: [0, 1, 1, 2, 1],
        totalVotes: 5
      }
    ]);

    render(<HealthCheckResults />);

    // Check that results are displayed
    const teamworkResult = screen.getByTestId('health-result-teamwork');
    expect(teamworkResult).toBeInTheDocument();
    
    const funResult = screen.getByTestId('health-result-fun');
    expect(funResult).toBeInTheDocument();
    
    // Check the scores are displayed
    expect(teamworkResult).toHaveTextContent('4.2');
    expect(funResult).toHaveTextContent('3.6');
  });

  test('shows overall average score', () => {
    mockGetHealthCheckStats.mockReturnValue([
      {
        id: 'teamwork',
        label: 'Teamwork',
        description: 'How well is the team collaborating?',
        average: 4.0,
        distribution: [0, 0, 2, 1, 2],
        totalVotes: 5
      },
      {
        id: 'fun',
        label: 'Fun',
        description: 'How much fun are we having at work?',
        average: 3.0,
        distribution: [0, 1, 2, 1, 1],
        totalVotes: 5
      }
    ]);

    render(<HealthCheckResults />);

    // Overall average is (4.0 + 3.0) / 2 = 3.5
    expect(screen.getByTestId('health-overall-score')).toHaveTextContent('3.5');
    expect(screen.getByText('Good')).toBeInTheDocument();
  });

  test('shows participation count', () => {
    mockGetHealthCheckStats.mockReturnValue([
      {
        id: 'teamwork',
        label: 'Teamwork',
        description: 'How well is the team collaborating?',
        average: 4.2,
        distribution: [0, 0, 1, 2, 4],
        totalVotes: 7
      },
      {
        id: 'fun',
        label: 'Fun',
        description: 'How much fun are we having at work?',
        average: 3.8,
        distribution: [0, 1, 1, 3, 2],
        totalVotes: 7
      }
    ]);

    useBoardContext.mockReturnValue({
      ...defaultMockContext,
      healthCheckVotes: {
        teamwork: { u1: 4, u2: 5, u3: 3 },
        fun: { u1: 4, u4: 2 }
      }
    });

    render(<HealthCheckResults />);

    expect(screen.getByText('4')).toBeInTheDocument();
  });

  test('shows correct overall label for great score', () => {
    mockGetHealthCheckStats.mockReturnValue([
      {
        id: 'teamwork',
        label: 'Teamwork',
        description: 'How well is the team collaborating?',
        average: 4.8,
        distribution: [0, 0, 0, 1, 4],
        totalVotes: 5
      },
      {
        id: 'fun',
        label: 'Fun',
        description: 'How much fun are we having at work?',
        average: 4.6,
        distribution: [0, 0, 0, 2, 3],
        totalVotes: 5
      }
    ]);

    render(<HealthCheckResults />);

    // Overall average is (4.8 + 4.6) / 2 = 4.7
    expect(screen.getByTestId('health-overall-score')).toHaveTextContent('4.7');
    expect(screen.getByText('Great')).toBeInTheDocument();
  });

  test('shows correct overall label for poor score', () => {
    mockGetHealthCheckStats.mockReturnValue([
      {
        id: 'teamwork',
        label: 'Teamwork',
        description: 'How well is the team collaborating?',
        average: 2.0,
        distribution: [1, 2, 1, 0, 0],
        totalVotes: 4
      },
      {
        id: 'fun',
        label: 'Fun',
        description: 'How much fun are we having at work?',
        average: 1.8,
        distribution: [2, 1, 1, 0, 0],
        totalVotes: 4
      }
    ]);

    render(<HealthCheckResults />);

    // Overall average is (2.0 + 1.8) / 2 = 1.9
    expect(screen.getByTestId('health-overall-score')).toHaveTextContent('1.9');
    expect(screen.getByText('Poor')).toBeInTheDocument();
  });

  test('shows an inline vote distribution for each question', () => {
    mockGetHealthCheckStats.mockReturnValue([
      {
        id: 'teamwork',
        label: 'Teamwork',
        description: 'How well is the team collaborating?',
        average: 4.0,
        distribution: [1, 0, 1, 1, 2],
        totalVotes: 5
      }
    ]);

    render(<HealthCheckResults />);

    const dist = screen.getByLabelText('Teamwork vote distribution');
    expect(dist.querySelectorAll('.dist-bar')).toHaveLength(5);
    expect(dist.querySelector('[data-rating="5"]')).toHaveAttribute('title', '5: 2');
  });

  test('handles single participant correctly', () => {
    mockGetHealthCheckStats.mockReturnValue([
      {
        id: 'teamwork',
        label: 'Teamwork',
        description: 'How well is the team collaborating?',
        average: 5.0,
        distribution: [0, 0, 0, 0, 1],
        totalVotes: 1
      }
    ]);

    useBoardContext.mockReturnValue({
      ...defaultMockContext,
      healthCheckVotes: { teamwork: { u1: 5 } }
    });

    render(<HealthCheckResults />);

    expect(screen.getByTestId('health-result-teamwork')).toHaveTextContent('5.0');
  });

  test('shows question descriptions as tooltips', () => {
    mockGetHealthCheckStats.mockReturnValue([
      {
        id: 'teamwork',
        label: 'Teamwork',
        description: 'How well is the team collaborating?',
        average: 4.0,
        distribution: [0, 0, 1, 2, 2],
        totalVotes: 5
      },
      {
        id: 'fun',
        label: 'Fun',
        description: 'How much fun are we having at work?',
        average: 3.5,
        distribution: [0, 1, 1, 2, 1],
        totalVotes: 5
      }
    ]);

    render(<HealthCheckResults />);

    expect(screen.getByText('Teamwork')).toHaveAttribute('title', 'How well is the team collaborating?');
    expect(screen.getByText('Fun')).toHaveAttribute('title', 'How much fun are we having at work?');
  });

  test('shows no data indicator for questions with zero votes when other questions have votes', () => {
    mockGetHealthCheckStats.mockReturnValue([
      {
        id: 'teamwork',
        label: 'Teamwork',
        description: 'How well is the team collaborating?',
        average: 4.0,
        distribution: [0, 0, 1, 2, 2],
        totalVotes: 5
      },
      {
        id: 'fun',
        label: 'Fun',
        description: 'How much fun are we having at work?',
        average: 0,
        distribution: [0, 0, 0, 0, 0],
        totalVotes: 0
      }
    ]);

    render(<HealthCheckResults />);

    // Should show results since at least one question has votes
    const teamworkResult = screen.getByTestId('health-result-teamwork');
    expect(teamworkResult).toBeInTheDocument();
    
    // The fun question should show "—" for no data
    const funResult = screen.getByTestId('health-result-fun');
    expect(funResult).toHaveTextContent('—');
  });
});
