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
            revealMode: false,
            cardsRevealed: false
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
            revealMode: true,
            cardsRevealed: false
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
            revealMode: true,
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
            revealMode: true,
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
            revealMode: true,
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
            revealMode: true,
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

    test('disables voting when cards are obfuscated for non-creators', () => {
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
            revealMode: true,
            cardsRevealed: false
        });

        renderCard({ cardData: cardDataFromOtherUser });

        // Find voting buttons by their exact disabled titles
        const voteButtons = screen.getAllByTitle('Voting disabled until cards are revealed');
        expect(voteButtons).toHaveLength(2); // Should be upvote and downvote

        const upvoteButton = voteButtons[0];
        const downvoteButton = voteButtons[1];

        expect(upvoteButton).toBeDisabled();
        expect(downvoteButton).toBeDisabled();
        expect(upvoteButton.title).toBe('Voting disabled until cards are revealed');
        expect(downvoteButton.title).toBe('Voting disabled until cards are revealed');
    });

    test('disables reactions when cards are obfuscated for non-creators', () => {
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
            revealMode: true,
            cardsRevealed: false
        });

        renderCard({ cardData: cardDataFromOtherUser });

        // Find add reaction button specifically by role and text
        const addReactionButton = screen.getByRole('button', { name: '+' });
        expect(addReactionButton).toBeDisabled();
        expect(addReactionButton.title).toContain('Reactions disabled until cards are revealed');

        // Existing reaction should be disabled
        const emojiReaction = screen.getByTestId('emoji-reaction');
        expect(emojiReaction).toHaveClass('disabled');
    });

    test('disables voting and reactions for ALL users (including creators) when cards not revealed', () => {
        useBoardContext.mockReturnValue({
            boardId: 'board123',
            user: { uid: 'user123' }, // Same as card creator
            votingEnabled: true,
            downvotingEnabled: true,
            multipleVotesAllowed: false,
            revealMode: true,
            cardsRevealed: false
        });

        renderCard(); // Uses default mockCardData with createdBy: 'user123'

        // Even for creators, voting buttons should be disabled when cards aren't revealed
        const voteButtons = screen.getAllByTitle('Voting disabled until cards are revealed');
        expect(voteButtons).toHaveLength(2);

        const upvoteButton = voteButtons[0];
        const downvoteButton = voteButtons[1];

        expect(upvoteButton).toBeDisabled();
        expect(downvoteButton).toBeDisabled();

        // Add reaction button should also be disabled for creators
        const addReactionButton = screen.getByRole('button', { name: '+' });
        expect(addReactionButton).toBeDisabled();
        expect(addReactionButton.title).toContain('Reactions disabled until cards are revealed');
    });

    test('enables voting and reactions when cards are revealed', () => {
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
            revealMode: true,
            cardsRevealed: true // Cards are revealed
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

        // Existing reaction should NOT have disabled class
        const emojiReaction = screen.getByTestId('emoji-reaction');
        expect(emojiReaction).not.toHaveClass('disabled');
    });

    test('disables editing for non-creators when cards are obfuscated', () => {
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
            revealMode: true,
            cardsRevealed: false
        });

        renderCard({ cardData: cardDataFromOtherUser });

        // Find the card element by its test content
        const cardContent = screen.getByTestId('card-content');
        const cardElement = cardContent.closest('.card');

        // Card should have editing-disabled class and not-allowed cursor
        expect(cardElement).toHaveClass('editing-disabled');
        expect(cardElement).toHaveStyle('cursor: not-allowed');
    });

    test('allows editing for creators when cards are obfuscated', () => {
        useBoardContext.mockReturnValue({
            boardId: 'board123',
            user: { uid: 'user123' }, // Same as card creator
            votingEnabled: true,
            downvotingEnabled: true,
            multipleVotesAllowed: false,
            revealMode: true,
            cardsRevealed: false
        });

        renderCard(); // Uses default mockCardData with createdBy: 'user123'

        // Find the card element
        const cardElement = screen.getByText('Test card content for retro').closest('.card');

        // Card should NOT have editing-disabled class and should have pointer cursor
        expect(cardElement).not.toHaveClass('editing-disabled');
        expect(cardElement).toHaveStyle('cursor: pointer');
    });
});
