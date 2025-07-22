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
});
