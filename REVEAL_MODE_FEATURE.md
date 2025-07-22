# Reveal Mode Feature

## Overview

The Reveal Mode feature is designed specifically for retrospectives and similar activities where participants need to add items to the board without others seeing what they've written until all contributions are complete. Each person can see their own contributions but not others' until the reveal button is clicked.

## How It Works

1. **Enable Reveal Mode**: Navigate to Settings → Reveal Mode (for retrospectives) → On
2. **Add Cards**: When reveal mode is active, newly added cards appear with obfuscated text (█████████) to other users
3. **Creator Visibility**: The person who created a card can always see their own unobfuscated content
4. **Reveal All**: Click the "👁️ Reveal All Cards" button to simultaneously reveal all card content to everyone
5. **Normal Operation**: After revealing, cards behave normally and new cards are visible immediately to all users

## Key Features

### Creator Visibility
- **Your Own Cards**: You can always see the full content of cards you created, even when reveal mode is active
- **Others' Cards**: You see obfuscated text (█████████) for cards created by other users until revealed
- **Privacy**: This ensures you can review and edit your own contributions while maintaining privacy for others

### Visual Obfuscation
- Uses block characters (█) to maintain the original text length
- Preserves spaces and punctuation for readability
- Shows the general structure without revealing the actual content

## Use Cases

- **Retrospectives**: Team members can add feedback without being influenced by others' contributions
- **Brainstorming**: Collect ideas independently before group discussion
- **Feedback Collection**: Gather anonymous input before review
- **Planning Sessions**: Independent assessment before group prioritization

## Technical Details

### Card Creation
- Cards now store `createdBy` field with the user's UID
- Creator information is used to determine visibility permissions
- Backwards compatible with existing cards (no `createdBy` field)

### Settings
- Stored in Firebase under `boards/{boardId}/settings/revealMode`
- Boolean setting (true = enabled, false = disabled)
- Local state tracked for reveal status (`cardsRevealed`)

### Visibility Logic
- If reveal mode is disabled: all cards visible to everyone
- If reveal mode is enabled and cards not revealed:
  - Card creators see their own content unobfuscated
  - Non-creators see obfuscated text (█████████)
- If cards have been revealed: all cards visible to everyone

### Visual Design
- Obfuscated text uses block characters (█) maintaining original length
- Preserves spaces and punctuation for readability
- Applies CSS class `obfuscated` for styling
- Uses monospace font and muted colors

### State Management
- `revealMode`: Global setting for the board
- `cardsRevealed`: Local state tracking if cards have been revealed
- Resets `cardsRevealed` when `revealMode` setting changes

## Implementation Files

- `src/context/BoardContext.jsx` - State management and Firebase integration
- `src/components/Board.jsx` - Settings UI and reveal button
- `src/components/Card.jsx` - Text obfuscation logic and creator visibility
- `src/components/Column.jsx` - Updated to pass user info when creating cards
- `src/utils/boardUtils.js` - Updated card creation to include creator info
- `src/styles/components/cards.css` - Obfuscated text styling
- `src/styles/components/buttons.css` - Reveal button pulse animation
- `src/components/Card.reveal.test.jsx` - Test coverage

## Testing

The feature includes comprehensive test coverage:
- Normal content display when reveal mode is disabled
- Obfuscated content when reveal mode is enabled and cards not revealed
- Normal content when cards are revealed
- Creator can see their own content even when reveal mode is active
- Non-creators see obfuscated content from others when reveal mode is active
- Proper preservation of spaces and punctuation in obfuscated text
