import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Card from './Card';

// Mock BoardContext
vi.mock('../context/BoardContext', () => ({
    useBoardContext: vi.fn()
}));

// Mock react-dnd
vi.mock('react-dnd', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useDrag: () => [{ isDragging: false }, vi.fn()],
        useDrop: () => [{ isOver: false }, vi.fn()],
        DndProvider: ({ children }) => children // Simple mock that just renders children
    };
});

// Mock react-dnd-html5-backend
vi.mock('react-dnd-html5-backend', () => ({
    HTML5Backend: {}
}));

// Mock react-dom
vi.mock('react-dom', () => ({
    default: {
        createPortal: (element) => element
    }
}));

import { useBoardContext } from '../context/BoardContext';

describe('Card Reveal Mode', () => {
    const mockCardData = {
        content: 'Test card content for retro',
        votes: 3,
        reactions: {},
        comments: {},
        createdBy: 'user123' // Add creator information
    };

    const mockProps = {
        cardId: 'card123',
        cardData: mockCardData,
        columnId: 'column1',
        showNotification: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderCard = (props = {}) => {
        return render(
            <DndProvider backend={HTML5Backend}>
                <Card {...mockProps} {...props} />
            </DndProvider>
        );
    };

    test('shows normal content when reveal mode is disabled', () => {
        useBoardContext.mockReturnValue({
            boardId: 'board123',
            user: { uid: 'user123' },
            votingEnabled: true,
            downvotingEnabled: true,
            multipleVotesAllowed: false,
            retrospectiveMode: false,
            workflowPhase: 'CREATION'
        });

        renderCard();

        expect(screen.getByText('Test card content for retro')).toBeInTheDocument();
    });

    test('shows obfuscated content when reveal mode is enabled and cards not revealed', () => {
        const cardDataFromOtherUser = {
            ...mockCardData,
            createdBy: 'other-user-456' // Different creator
        };

        useBoardContext.mockReturnValue({
            boardId: 'board123',
            user: { uid: 'user123' },
            votingEnabled: true,
            downvotingEnabled: true,
            multipleVotesAllowed: false,
            retrospectiveMode: true,
            workflowPhase: 'CREATION'
        });

        renderCard({ cardData: cardDataFromOtherUser });

        // Should not show original text
        expect(screen.queryByText('Test card content for retro')).not.toBeInTheDocument();

        // Should show obfuscated text (with block characters)
        const cardContent = screen.getByTestId('card-content');
        expect(cardContent.textContent).toContain('█');
        expect(cardContent).toHaveClass('obfuscated');
    });

    test('shows normal content when reveal mode is enabled but cards are revealed', () => {
        useBoardContext.mockReturnValue({
            boardId: 'board123',
            user: { uid: 'user123' },
            votingEnabled: true,
            downvotingEnabled: true,
            multipleVotesAllowed: false,
            retrospectiveMode: true,
            cardsRevealed: true
        });

        renderCard();

        expect(screen.getByText('Test card content for retro')).toBeInTheDocument();

        // Should not have obfuscated class
        const cardContent = screen.getByTestId('card-content');
        expect(cardContent).not.toHaveClass('obfuscated');
    });

    test('obfuscated text preserves spaces only', () => {
        const cardDataWithPunctuation = {
            ...mockCardData,
            content: 'Hello, world! This is a test.',
            createdBy: 'other-user-456' // Different creator so text gets obfuscated
        };

        useBoardContext.mockReturnValue({
            boardId: 'board123',
            user: { uid: 'user123' },
            votingEnabled: true,
            downvotingEnabled: true,
            multipleVotesAllowed: false,
            retrospectiveMode: true,
            cardsRevealed: false
        });

        renderCard({ cardData: cardDataWithPunctuation });

        const cardContent = screen.getByTestId('card-content');
        const obfuscatedText = cardContent.textContent;

        // Should preserve spaces
        expect(obfuscatedText).toContain(' ');

        // Should NOT preserve punctuation (now using simple fallback)
        expect(obfuscatedText).not.toContain(',');
        expect(obfuscatedText).not.toContain('!');
        expect(obfuscatedText).not.toContain('.');

        // Should contain block characters for letters and punctuation
        expect(obfuscatedText).toContain('█');
    });

    test('shows unobfuscated content to card creator even when reveal mode is active', () => {
        useBoardContext.mockReturnValue({
            boardId: 'board123',
            user: { uid: 'user123' }, // Same as card creator
            votingEnabled: true,
            downvotingEnabled: true,
            multipleVotesAllowed: false,
            retrospectiveMode: true,
            cardsRevealed: false
        });

        renderCard();

        // Creator should see original text even when reveal mode is active
        expect(screen.getByText('Test card content for retro')).toBeInTheDocument();

        // Should not have obfuscated class
        const cardContent = screen.getByTestId('card-content');
        expect(cardContent).not.toHaveClass('obfuscated');
    });

    test('shows obfuscated content to non-creators when reveal mode is active', () => {
        const cardDataFromOtherUser = {
            ...mockCardData,
            createdBy: 'other-user-456' // Different creator
        };

        useBoardContext.mockReturnValue({
            boardId: 'board123',
            user: { uid: 'user123' }, // Different from card creator
            votingEnabled: true,
            downvotingEnabled: true,
            multipleVotesAllowed: false,
            retrospectiveMode: true,
            cardsRevealed: false
        });

        renderCard({ cardData: cardDataFromOtherUser });

        // Non-creator should not see original text
        expect(screen.queryByText('Test card content for retro')).not.toBeInTheDocument();

        // Should show obfuscated text (with block characters)
        const cardContent = screen.getByTestId('card-content');
        expect(cardContent.textContent).toContain('█');
        expect(cardContent).toHaveClass('obfuscated');
    });

    test('hides voting when cards are obfuscated for non-creators', () => {
        const cardDataFromOtherUser = {
            ...mockCardData,
            createdBy: 'other-user-456' // Different creator
        };

        useBoardContext.mockReturnValue({
            boardId: 'board123',
            user: { uid: 'user123' },
            votingEnabled: true,
            downvotingEnabled: true,
            multipleVotesAllowed: false,
            retrospectiveMode: true,
            workflowPhase: 'CREATION' // Cards not revealed yet
        });

        renderCard({ cardData: cardDataFromOtherUser });

        // Voting should be completely hidden during CREATION phase in reveal mode
        expect(screen.queryByTitle('Upvote')).not.toBeInTheDocument();
        expect(screen.queryByTitle('Downvote')).not.toBeInTheDocument();
        expect(screen.queryByTitle('Voting disabled until cards are revealed')).not.toBeInTheDocument();
        
        // Card content should have full-width class since voting is hidden
        const cardContent = screen.getByTestId('card-content');
        expect(cardContent).toHaveClass('full-width');
    });

    test('hides reactions when cards are obfuscated for non-creators', () => {
        const cardDataFromOtherUser = {
            ...mockCardData,
            createdBy: 'other-user-456', // Different creator
            reactions: {
                '😄': { count: 1, users: { 'other-user': true } }
            }
        };

        useBoardContext.mockReturnValue({
            boardId: 'board123',
            user: { uid: 'user123' },
            votingEnabled: true,
            downvotingEnabled: true,
            multipleVotesAllowed: false,
            retrospectiveMode: true,
            workflowPhase: 'CREATION' // Cards not revealed yet
        });

        renderCard({ cardData: cardDataFromOtherUser });

        // Reactions should be completely hidden during CREATION phase in reveal mode
        expect(screen.queryByRole('button', { name: '+' })).not.toBeInTheDocument();
        expect(screen.queryByText('😄')).not.toBeInTheDocument();
        expect(screen.queryByTitle('Toggle comments')).not.toBeInTheDocument();
        
        // No emoji reactions section should be present
        expect(screen.queryByTestId('emoji-reaction')).not.toBeInTheDocument();
    });

    test('hides voting and reactions for ALL users (including creators) when cards not revealed', () => {
        useBoardContext.mockReturnValue({
            boardId: 'board123',
            user: { uid: 'user123' }, // Same as card creator
            votingEnabled: true,
            downvotingEnabled: true,
            multipleVotesAllowed: false,
            retrospectiveMode: true,
            workflowPhase: 'CREATION' // Cards not revealed yet
        });

        renderCard(); // Uses default mockCardData with createdBy: 'user123'

        // Even for creators, voting and reactions should be hidden during CREATION phase
        expect(screen.queryByTitle('Upvote')).not.toBeInTheDocument();
        expect(screen.queryByTitle('Downvote')).not.toBeInTheDocument();
        expect(screen.queryByTitle('Voting disabled until cards are revealed')).not.toBeInTheDocument();
        
        // Reactions should also be hidden
        expect(screen.queryByRole('button', { name: '+' })).not.toBeInTheDocument();
        expect(screen.queryByTitle('Toggle comments')).not.toBeInTheDocument();
        
        // Card content should have full-width class since voting is hidden
        const cardContent = screen.getByTestId('card-content');
        expect(cardContent).toHaveClass('full-width');
    });

    test('enables voting and reactions when cards are revealed but interactions not revealed', () => {
        const cardDataFromOtherUser = {
            ...mockCardData,
            createdBy: 'other-user-456', // Different creator
            reactions: {
                '😄': { count: 1, users: { 'other-user': true } }
            }
        };

        useBoardContext.mockReturnValue({
            boardId: 'board123',
            user: { uid: 'user123' },
            votingEnabled: true,
            downvotingEnabled: true,
            multipleVotesAllowed: false,
            retrospectiveMode: true,
            workflowPhase: 'INTERACTIONS' // Cards revealed, interactions allowed
        });

        renderCard({ cardData: cardDataFromOtherUser });

        // Find voting buttons by their normal titles when enabled
        const upvoteButton = screen.getByTitle('Upvote');
        const downvoteButton = screen.getByTitle('Downvote');

        expect(upvoteButton).not.toBeDisabled();
        expect(downvoteButton).not.toBeDisabled();

        // Add reaction button should be enabled when revealed
        const addReactionButton = screen.getByRole('button', { name: '+' });
        expect(addReactionButton).not.toBeDisabled();

        // In INTERACTIONS phase, others' interactions should NOT be visible
        // The reaction from 'other-user' should be hidden
        expect(screen.queryByTestId('emoji-reaction')).not.toBeInTheDocument();
    });

    test('freezes interactions when interactions are revealed', () => {
        const cardDataFromOtherUser = {
            ...mockCardData,
            createdBy: 'other-user-456', // Different creator
            reactions: {
                '😄': { count: 1, users: { 'other-user': true } }
            }
        };

        useBoardContext.mockReturnValue({
            boardId: 'board123',
            user: { uid: 'user123' },
            votingEnabled: true,
            downvotingEnabled: true,
            multipleVotesAllowed: false,
            retrospectiveMode: true,
            workflowPhase: 'INTERACTION_REVEAL' // Interactions revealed (frozen)
        });

        renderCard({ cardData: cardDataFromOtherUser });

        // Find voting buttons - they should be disabled when interactions are revealed
        const votingButtons = screen.getAllByTitle('Voting is frozen - no more changes allowed');
        expect(votingButtons).toHaveLength(2); // upvote and downvote
        votingButtons.forEach(button => {
            expect(button).toBeDisabled();
        });

        // Add reaction button should be hidden when interactions are frozen
        const addReactionButton = screen.queryByRole('button', { name: '+' });
        expect(addReactionButton).not.toBeInTheDocument(); // Changed: button should be hidden when frozen

        // Existing reaction should NOT have disabled class when frozen (should look normal but not be clickable)
        const emojiReaction = screen.getByTestId('emoji-reaction');
        expect(emojiReaction).not.toHaveClass('disabled'); // Changed: no disabled class when frozen
    });

    test('disables editing for non-creators when cards are obfuscated', () => {
        const cardDataFromOtherUser = {
            ...mockCardData,
            createdBy: 'other-user-456' // Different from the current user
        };

        useBoardContext.mockReturnValue({
            boardId: 'board123',
            user: { uid: 'user123' }, // Different from card creator
            votingEnabled: true,
            downvotingEnabled: true,
            multipleVotesAllowed: false,
            retrospectiveMode: true,
            cardsRevealed: false
        });

        renderCard({ cardData: cardDataFromOtherUser });

        // Find the card element by its test content
        const cardContent = screen.getByTestId('card-content');
        const cardElement = cardContent.closest('.card');

        // Card should have editing-disabled class and normal drag (no grouping yet)
        expect(cardElement).toHaveClass('editing-disabled');
        expect(cardElement).not.toHaveClass('groupable');
        expect(cardElement).toHaveClass('cursor-not-allowed');
    });

    test('allows editing for creators when cards are obfuscated', () => {
        useBoardContext.mockReturnValue({
            boardId: 'board123',
            user: { uid: 'user123' }, // Same as card creator
            votingEnabled: true,
            downvotingEnabled: true,
            multipleVotesAllowed: false,
            retrospectiveMode: true,
            workflowPhase: 'CREATION' // Cards not revealed yet
        });

        renderCard(); // Uses default mockCardData with createdBy: 'user123'

        // Find the card element
        const cardElement = screen.getByText('Test card content for retro').closest('.card');

        // Card should NOT have editing-disabled class (creator can edit)
        expect(cardElement).not.toHaveClass('editing-disabled');

        // Card should NOT be groupable yet (still in CREATION phase)
        expect(cardElement).not.toHaveClass('groupable');
        expect(cardElement).toHaveClass('cursor-pointer'); // Creator can still edit
    });

    test('enables card-on-card dragging for grouping when cards are revealed', () => {
        useBoardContext.mockReturnValue({
            boardId: 'board123',
            user: { uid: 'user123' }, // Same as card creator
            votingEnabled: true,
            downvotingEnabled: true,
            multipleVotesAllowed: false,
            retrospectiveMode: true,
            workflowPhase: 'GROUPING' // Grouping phase - cards revealed and grouping enabled
        });

        renderCard(); // Uses default mockCardData with createdBy: 'user123'

        // Find the card element
        const cardContent = screen.getByTestId('card-content');
        const cardElement = cardContent.closest('.card');

        // Card should be groupable for drag-onto-card functionality during GROUPING phase
        expect(cardElement).toHaveClass('groupable');
        expect(cardElement).toHaveClass('cursor-grab');
    });

    test('disables dragging when cards are obfuscated (before reveal) for non-creators', () => {
        useBoardContext.mockReturnValue({
            boardId: 'board123',
            user: { uid: 'other-user' }, // Non-creator
            votingEnabled: true,
            downvotingEnabled: true,
            multipleVotesAllowed: false,
            retrospectiveMode: true,
            cardsRevealed: false // Cards are obfuscated
        });

        renderCard(); // Uses default mockCardData with createdBy: 'user123'

        // Find the card element
        const cardContent = screen.getByTestId('card-content');
        const cardElement = cardContent.closest('.card');

        // Card should have drag disabled when obfuscated for non-creators
        expect(cardElement).toHaveClass('drag-disabled');
        expect(cardElement).toHaveClass('cursor-not-allowed');
    });

    test('enables dragging when cards are revealed', () => {
        useBoardContext.mockReturnValue({
            boardId: 'board123',
            user: { uid: 'user123' },
            votingEnabled: true,
            downvotingEnabled: true,
            multipleVotesAllowed: false,
            retrospectiveMode: true,
            workflowPhase: 'GROUPING' // Grouping phase - cards revealed and dragging enabled
        });

        renderCard();

        // Find the card element
        const cardContent = screen.getByTestId('card-content');
        const cardElement = cardContent.closest('.card');

        // Card should NOT have drag-disabled class during GROUPING phase
        expect(cardElement).not.toHaveClass('drag-disabled');
        expect(cardElement).toHaveClass('cursor-grab'); // Grouping mode cursor
    });

    test('enables dragging when reveal mode is disabled', () => {
        useBoardContext.mockReturnValue({
            boardId: 'board123',
            user: { uid: 'user123' },
            votingEnabled: true,
            downvotingEnabled: true,
            multipleVotesAllowed: false,
            retrospectiveMode: false, // Reveal mode is off
            cardsRevealed: false
        });

        renderCard();

        // Find the card element
        const cardContent = screen.getByTestId('card-content');
        const cardElement = cardContent.closest('.card');

        // Card should NOT have drag-disabled class when reveal mode is off
        expect(cardElement).not.toHaveClass('drag-disabled');
        expect(cardElement).toHaveClass('cursor-pointer');
    });
});
