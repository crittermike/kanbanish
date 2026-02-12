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
    getHealthCheckStats: mockGetHealthCheckStats
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

    expect(screen.getByText('No votes have been submitted yet.')).toBeInTheDocument();
    expect(screen.getByText('Participants need to complete the health check first.')).toBeInTheDocument();
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
    expect(screen.getByText('3.5')).toBeInTheDocument();
    expect(screen.getByText('5.0')).toBeInTheDocument();
    expect(screen.getByText('Overall: Good')).toBeInTheDocument();
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

    render(<HealthCheckResults />);

    expect(screen.getByText('7 participants')).toBeInTheDocument();
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
    expect(screen.getByText('4.7')).toBeInTheDocument();
    expect(screen.getByText('Overall: Great')).toBeInTheDocument();
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
    expect(screen.getByText('1.9')).toBeInTheDocument();
    expect(screen.getByText('Overall: Poor')).toBeInTheDocument();
  });

  test('displays vote distribution section for questions with votes', () => {
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

    expect(screen.getByText('Vote Distribution')).toBeInTheDocument();
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

    render(<HealthCheckResults />);

    expect(screen.getByText('1 participant')).toBeInTheDocument();
  });

  test('displays all question descriptions', () => {
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

    expect(screen.getByText('How well is the team collaborating?')).toBeInTheDocument();
    expect(screen.getByText('How much fun are we having at work?')).toBeInTheDocument();
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
