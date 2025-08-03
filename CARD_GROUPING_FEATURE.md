# Card Grouping Feature

This document describes the new card grouping functionality added to Kanbanish, which allows users to group related cards together with visual stacking, expand/collapse functionality, and easy ungrouping.

## Features

### 1. **Card Selection**

- Users can select multiple cards by clicking on them when in multi-select mode
- Selected cards are visually highlighted with a border and selection checkbox
- Selection count is displayed in the column header

### 2. **Group Creation**

- Select 2 or more cards using multi-select mode
- Click the group button (📦) in the column header
- Enter a custom name for the group
- Cards are automatically moved into the new group

### 3. **Visual Stacking**

- Grouped cards appear as a visually stacked container
- When collapsed, shows a preview of the first 3 cards with stacking effect
- Displays total card count in the group header

### 4. **Expand/Collapse**

- Click the group header to expand/collapse the group
- Expanded groups show all cards individually
- Collapsed groups show a stacked preview

### 5. **Group Management**

- Edit group names by clicking on the group title
- Ungroup cards using the scissors (✂️) button
- Drag cards into and out of groups

## How to Use

### Creating a Group

1. **Select Cards**: Click on multiple cards to select them (they'll show selection checkboxes)
2. **Group Button**: Click the package icon (📦) in the column header
3. **Name Group**: Enter a name for your group in the modal
4. **Confirm**: Click "Create Group" to finalize

### Managing Groups

- **Expand/Collapse**: Click the group header or chevron icon
- **Rename**: Click on the group name to edit it inline
- **Ungroup**: Click the scissors (✂️) button to break apart the group
- **Add Cards**: Drag cards from elsewhere and drop them on the group
- **Remove Cards**: Drag cards out of an expanded group

### Visual Indicators

- **Selected Cards**: Blue border and checkmark in top-right corner
- **Grouped Cards**: Contained within a group container with header
- **Collapsed Groups**: Show stacked card previews with "+X more" indicator
- **Drag Targets**: Groups highlight when cards are dragged over them

## Technical Implementation

### Data Structure

```javascript
// Column structure with groups
{
  "columnId": {
    "title": "Column Title",
    "cards": {
      // Individual cards not in groups
    },
    "groups": {
      "groupId": {
        "name": "Group Name",
        "created": timestamp,
        "expanded": true/false,
        "cards": {
          // Cards within this group
        }
      }
    }
  }
}
```

### Key Components

- **CardGroup**: Renders grouped cards with expand/collapse functionality
- **Card**: Updated to support selection mode and group membership
- **Column**: Enhanced with multi-select UI and group creation modal

### Drag and Drop

- Cards can be dragged between columns, groups, and individual positions
- Groups serve as drop targets for cards
- Drag is disabled during multi-select mode to prevent conflicts

## Styling

### CSS Classes

- `.card-group`: Main group container
- `.card-group-header`: Group header with name and controls
- `.card-group-content`: Expanded group content area
- `.card-group-preview`: Collapsed group preview with stacking
- `.card.selected`: Selected card styling
- `.multi-select-mode`: Cards in selection mode

### Visual Effects

- Smooth expand/collapse animations
- Stacking effect for collapsed groups
- Selection indicators and highlights
- Hover states for interactive elements

## Accessibility

- **Keyboard Navigation**: Group names can be edited with Enter/Escape keys
- **Screen Readers**: Proper ARIA labels and semantic HTML structure
- **Visual Feedback**: Clear indicators for all interactive states
- **Confirmation Dialogs**: Destructive actions (ungroup) show confirmation

## Browser Compatibility

The feature uses modern CSS and JavaScript features:

- CSS Grid and Flexbox for layouts
- CSS Custom Properties for theming
- ES6+ JavaScript features
- React Hooks for state management

Supports all modern browsers (Chrome, Firefox, Safari, Edge).

## Future Enhancements

Potential improvements that could be added:

- **Nested Groups**: Groups within groups for complex organization
- **Group Templates**: Save and reuse common group structures
- **Batch Operations**: Apply actions to all cards in a group
- **Group Statistics**: View metrics for grouped cards
- **Color Coding**: Custom colors for different group types
