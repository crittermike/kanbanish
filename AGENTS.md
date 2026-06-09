# AGENTS.md — Kanbanish

> AI agent reference for working on this codebase. Read this before making changes.

## Project Overview

Kanbanish is a real-time collaborative kanban board with retrospective workflow support. Single-page React app backed by Firebase Realtime Database. No backend server — all state is synced directly through Firebase.

- **Live site**: https://www.kanbanish.com (deployed to GitHub Pages)
- **Repo**: https://github.com/crittermike/kanbanish

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 (JSX, no TypeScript) |
| Build | Vite |
| Database | Firebase Realtime Database |
| Auth | Firebase Anonymous Auth (no login UI) |
| Drag & Drop | react-dnd (HTML5 backend) |
| Icons | react-feather |
| Testing | Vitest + React Testing Library + jest-dom |
| Linting | ESLint (flat config) with react, react-hooks, import, jsx-a11y |
| Styles | Pure CSS with custom properties (no Tailwind, no CSS-in-JS) |
| CI/CD | GitHub Actions (test on PR, auto-deploy on push to main) |

## Project Structure

```
src/
├── index.jsx                    # Entry point (renders App)
├── App.jsx                      # Root: template URL handling, view gating (Dashboard vs Board)
├── setupTests.js                # Test setup (imports @testing-library/jest-dom)
│
├── data/
│   └── boardTemplates.js       # BOARD_TEMPLATES array — all template definitions (columns, icons, tags)
│
├── context/
│   └── BoardContext.jsx         # State provider + Firebase listeners (~450 lines, orchestrates hooks)
│
├── components/
│   ├── Board.jsx                # Main board layout: header, settings panel, columns (600+ lines)
│   ├── Dashboard.jsx            # Landing page: create board, pick template, recent boards
│   ├── Column.jsx               # Single column with cards
│   ├── Card.jsx                 # Individual card (content, votes, reactions, comments)
│   ├── CardGroup.jsx            # Grouped cards container
│   ├── CardHoverActions.jsx     # Hover action buttons on cards
│   ├── CardReactions.jsx        # Emoji reactions display
│   ├── CardCreationIndicator.jsx # Shows who's typing
│   ├── Comments.jsx             # Comment thread on cards/groups
│   ├── EmojiPicker.jsx          # Emoji selection popover
│   ├── VoteCounter.jsx          # Per-card vote display
│   ├── BaseVoteCounter.jsx      # Shared vote counter logic
│   ├── TotalVoteCounter.jsx     # Aggregate vote display
│   ├── UserCounter.jsx          # Active users indicator
│   ├── VotingControls.jsx       # Vote up/down buttons
│   ├── WorkflowControls.jsx     # Retrospective phase stepper
│   ├── ResultsView.jsx          # Results phase display
│   ├── PollVoting.jsx           # 1-5 star poll input
│   ├── PollResults.jsx          # Poll results display
│   ├── HealthCheckVoting.jsx    # Health check voting input
│   ├── HealthCheckResults.jsx   # Health check results display
│   └── modals/
│       ├── ExportBoardModal.jsx
│       ├── NewBoardTemplateModal.jsx
│       └── VoteLimitModal.jsx
│
├── hooks/
│   ├── usePoll.js                   # Poll voting operations (submitPollVote, getPollStats)
│   ├── useHealthCheck.js            # Health check voting (submitHealthCheckVote, getHealthCheckStats)
│   ├── useBoardSettings.js          # Board settings CRUD (updateVotingEnabled, etc.)
│   ├── usePresence.js               # User presence tracking, card creation activity indicators
│   ├── useVoting.js                 # Vote operations (resetAllVotes, upvoteGroup, downvoteGroup, vote counting)
│   ├── useGroups.js                 # Card grouping (moveCard, createCardGroup, ungroupCards, removeAllGrouping)
│   ├── useWorkflow.js               # Retrospective workflow phase transitions
│   ├── useCardOperations.jsx        # Card CRUD, voting, reactions, comments
│   ├── useGroupOperations.jsx       # Group-level reactions and comments
│   ├── useVoteCounterVisibility.jsx # Intersection observer for vote counters
│   └── useRecentBoards.js           # localStorage-backed recent boards list (add, remove, pin)
│
├── utils/
│   ├── firebase.js              # Firebase init + re-exports (database, auth, signInAnonymously, get, ref)
│   ├── boardUtils.js            # addColumn(), addCard(), createBoardFromTemplate() helpers
│   ├── helpers.js               # Re-export barrel (imports from ids, emoji, urlSettings, linkify)
│   ├── ids.js                   # generateId() — unique ID generation
│   ├── emoji.js                 # COMMON_EMOJIS array, getEmojiKeywords()
│   ├── urlSettings.js           # parseBool(), parseUrlSettings()
│   ├── linkify.js               # linkifyText() — URL detection in text
│   ├── workflowUtils.js         # WORKFLOW_PHASES enum, phase permission checks
│   └── retrospectiveModeUtils.js # Reveal phase logic
│
└── styles/
    ├── index.css                # CSS entry point, imports all component CSS
    └── components/
        ├── variables.css        # CSS custom properties (dark/light themes)
        ├── base.css
        ├── header.css
        ├── buttons.css
        ├── columns.css
        ├── cards.css
        ├── card-groups.css
        ├── modals.css
        ├── emoji-reactions.css
        ├── template-select.css
        ├── results.css
        ├── workflow.css
        ├── poll.css
        ├── health-check.css
        └── state-utilities.css
```

## Architecture

### State Management

All application state is managed through `BoardContext.jsx` (~450 lines), which serves as the orchestration layer. It:

1. Initializes Firebase connection and anonymous auth
2. Subscribes to Firebase Realtime Database via `onValue` listeners
3. Delegates domain operations to 7 extracted hooks (see Hook Architecture below)
4. Exposes all board state and operations to the component tree via context
5. Manages board creation, joining, URL settings parsing

### Hook Architecture

Domain logic is extracted from BoardContext into focused hooks. Each hook:
- **Receives dependencies as parameters** (not from context — avoids circular deps)
- Returns operation functions wrapped in `useCallback`
- BoardContext calls each hook, destructures the return, and spreads into context value
- **The context value shape is unchanged** — consumers still use `useBoardContext()`

**Hook call order in BoardContext** (order matters for inter-hook dependencies):

```javascript
// 1. usePresence — no hook dependencies
const { activeUsers, ... } = usePresence({ boardId, user });
// 2. useBoardSettings — no hook dependencies
const { updateBoardSettings, ... } = useBoardSettings({ boardId, user, ... });
// 3. usePoll — no hook dependencies
const { submitPollVote, getPollStats } = usePoll({ boardId, user, ... });
// 4. useHealthCheck — no hook dependencies
const { submitHealthCheckVote, ... } = useHealthCheck({ boardId, user, ... });
// 5. useVoting — depends on activeUsers from usePresence
const { resetAllVotes, ... } = useVoting({ boardId, user, columns, activeUsers, ... });
// 6. useGroups — no hook dependencies
const { moveCard, ..., removeAllGrouping } = useGroups({ boardId, user, columns });
// 7. useWorkflow — depends on updateBoardSettings AND removeAllGrouping
const { startGroupingPhase, ... } = useWorkflow({ updateBoardSettings, columns, ..., removeAllGrouping });
```

| Hook | Responsibility | Key exports |
|------|---------------|-------------|
| `usePresence` | User presence tracking, card creation indicators | `activeUsers`, `usersAddingCards`, `startCardCreation`, `stopCardCreation` |
| `useBoardSettings` | Board settings CRUD | `updateBoardSettings` + 6 setting-specific wrappers |
| `usePoll` | Poll voting | `submitPollVote`, `getPollStats` |
| `useHealthCheck` | Health check voting | `submitHealthCheckVote`, `getHealthCheckStats` |
| `useVoting` | Vote operations and counting | `resetAllVotes`, `getTotalVotes`, `getUserVoteCount`, `upvoteGroup`, `downvoteGroup` |
| `useGroups` | Card grouping | `moveCard`, `createCardGroup`, `ungroupCards`, `removeAllGrouping` |
| `useWorkflow` | Retrospective phase transitions | Phase transition functions (`startGroupingPhase`, etc.) |

**There is no routing library.** The board ID comes from the `?board=` query parameter. If none is provided, a new board is created.

### Data Flow

```
URL (?board=xyz) → BoardContext (Firebase listener) → Components (read from context)
User action → Component → Context method → Firebase set()/remove() → Firebase listener fires → State updates → Re-render
```

All Firebase writes use `set()` and `remove()` — never `update()`. This is an intentional pattern throughout the codebase.

### Component Architecture

- `App.jsx` gates between Dashboard and Board views based on `?board=` URL param
- `App.jsx` also handles `?template=<id>` URL param: auto-creates a board from a matching template and redirects to it (see URL Settings below)
- `App.jsx` uses `window.history.pushState` for URL management (no React Router)
- `Board.jsx` is the main layout: header bar, settings panel, and columns grid
- Components consume context via `useBoardContext()` hook
- Domain operations are extracted into hooks: 7 in `hooks/` called by BoardContext, plus `useCardOperations` and `useGroupOperations` used directly by components

### URL Settings

Board settings can be pre-configured via URL parameters:

```
?voting=true&downvotes=false&multivote=true&votes=5&retro=true&sort=votes&theme=dark
```

Parsed in `urlSettings.js` (re-exported via `helpers.js`) → `parseUrlSettings()`. Applied on board creation.

Additionally, `?template=<id>` creates a board from a predefined template and redirects to it (bypasses the template selection dialog). Template IDs match the `id` field in `src/data/boardTemplates.js` (e.g., `?template=lean-coffee`, `?template=retro`, `?template=big-orca`). This is handled in `App.jsx`, not `urlSettings.js`.

## Firebase Data Model

```
boards/{boardId}/
  title: string
  created: timestamp
  owner: string (uid)
  previousBoardId?: string (board series: link to the predecessor board)
  nextBoardId?: string     (board series: link to the successor board)
  columns/{columnId}/
    title: string
    cards/{cardId}/
      content: string
      votes: number
      created: timestamp
      createdBy: string (uid)
      groupId?: string
      voters/{userId}: number (+1 or -1)
      reactions/{emoji}/
        count: number
        users/{userId}: boolean
      comments/{commentId}/
        content: string
        timestamp: number
        createdBy: string (uid)
    groups/{groupId}/
      name: string
      created: timestamp
      expanded: boolean
      votes: number
      voters/{userId}: number
      cardIds: string[]
      reactions/...   (same structure as cards)
      comments/...    (same structure as cards)
  settings/
    votingEnabled: boolean
    downvotingEnabled: boolean
    multipleVotesAllowed: boolean
    votesPerUser: number
    sortByVotes: boolean
    retrospectiveMode: boolean
    workflowPhase: string
    resultsViewIndex: number
  presence/{userId}/
    lastSeen: timestamp
    uid: string
  cardCreationActivity/{userId}/
    columnId: string
    lastUpdated: timestamp
    uid: string
  poll/votes/{userId}: number (1-5)
  healthCheck/votes/{questionId}/{userId}: number (1-5)

users/{userId}/preferences/
  darkMode: boolean
```

### Key Data Conventions

- **Column IDs** are prefixed with an alphabet character for sort order: `a_xxx`, `b_xxx`, `c_xxx`
- **Card/comment authorship** tracked via `createdBy` field (Firebase anonymous UID)
- **Voting** uses a `voters` map with `+1`/`-1` values; `votes` field is the running total
- **Reactions** track both count and per-user state for toggling
- **Groups** hold a `cardIds` array; cards reference their group via `groupId`

## Workflow / Retrospective Mode

When `retrospectiveMode` is enabled, the board operates as a guided retrospective with phases:

```
HEALTH_CHECK → HEALTH_CHECK_RESULTS → CREATION → GROUPING → INTERACTIONS → INTERACTION_REVEAL → RESULTS → POLL → POLL_RESULTS
```

Defined in `workflowUtils.js` as the `WORKFLOW_PHASES` enum. Each phase restricts what actions are available (e.g., voting only in INTERACTIONS, card creation only in CREATION). Phase permission logic is in the `canPerformAction()` and related functions in `workflowUtils.js`.

The `INTERACTION_REVEAL` phase uses reveal logic in `retrospectiveModeUtils.js` to progressively show votes/reactions.

## Board Series

Boards can be linked into an ordered chain so users can page back to earlier boards (e.g. to review a previous retro's commitments). Works in both kanban and retrospective formats — it links *boards*, independent of workflow phases.

- Pointers live on the board node in Firebase (shared, not localStorage): `boards/{boardId}/previousBoardId` and `nextBoardId`. Linking A→B sets `B.previousBoardId = A` and `A.nextBoardId = B` (doubly-linked, adjacent paging only).
- Operations live in `src/hooks/useBoardSeries.js`: `startNextBoard` (clones the current board's column structure + settings with empty cards, links pointers, returns the new ID), `linkToPreviousBoard`, `unlinkFromSeries`. Wired through `BoardContext`.
- **Chain integrity**: replacing an existing link detaches the displaced neighbour's reciprocal pointer (no dangling back-references); `linkToPreviousBoard` walks the target's predecessor chain (bounded) and refuses links that would create a cycle; `unlinkFromSeries` splices the two neighbours together when removing a middle board.
- `BoardSeriesPager` (in the header via `BoardHeader`) renders `← Previous / Next →`, shown only when a pointer exists. Navigation reuses App's `?board=` mechanism (`handleOpenBoard`).
- **Gotcha**: `BoardGate` in `App.jsx` is keyed on `key={activeBoardId}` so navigating board→board remounts `BoardProvider` and re-subscribes (the provider does not resync `initialBoardId` on its own).
- Entry points: "Start next board" and "Link to previous board" in the Settings panel's Share & Export tab; the latter opens `LinkPreviousBoardModal` (recent-boards picker or paste a URL/ID, parsed by `utils/boardLink.js`).

## Styling

### CSS Architecture

- Pure CSS with custom properties for theming
- All styles in `src/styles/components/` — one file per component/concern
- `variables.css` defines the theme: dark mode is default, light mode via `.light-mode` class on `<html>`
- Theme toggle writes preference to Firebase at `users/{uid}/preferences/darkMode`
- No CSS modules, no BEM — just descriptive class names

### Theme Variables (in `variables.css`)

Dark theme is `:root` defaults. Light theme overrides via `html.light-mode`. Key variables:
- `--bg-primary`, `--bg-secondary`, `--bg-card`
- `--text-primary`, `--text-secondary`
- `--border-color`, `--accent-color`

## Testing

### Setup

- **Framework**: Vitest with jsdom environment, globals enabled
- **Setup file**: `src/setupTests.js` (imports `@testing-library/jest-dom`)
- **Config**: `vitest.config.js` — outputs `vitest.results.json`
- **Test files**: Co-located with components as `*.test.jsx`

### Commands

```bash
npm test          # Run all tests once
npm run test:watch # Run tests in watch mode
```

### Conventions

- Tests use React Testing Library (`render`, `screen`, `fireEvent`, `waitFor`)
- `BoardContext` is typically mocked in tests with a custom provider wrapper
- Firebase is mocked — no real database calls in tests

## Linting & Code Style

### ESLint (flat config in `eslint.config.js`)

Key rules:
- `react-hooks/exhaustive-deps`: **error** (not warning)
- `no-unused-vars`: error, but vars prefixed with `_` are ignored
- Import ordering enforced (alphabetical, grouped by builtin → external → internal)
- jsx-a11y plugin for accessibility

### Formatting

- 2-space indentation
- LF line endings
- UTF-8 encoding
- No trailing whitespace
- Enforced by `.editorconfig`

### VSCode Integration

`.vscode/settings.json` configures ESLint auto-fix on save.

```bash
npm run lint       # Check for lint errors
npm run lint:fix   # Auto-fix lint errors
npm run lint:check # Same as lint (alias)
```

## CI/CD

### Test Workflow (`.github/workflows/test.yml`)

- Triggers on: push to main, PRs targeting main
- Runs on: Ubuntu latest, Node 20
- Steps: checkout → install → lint → test

### Deploy Workflow (`.github/workflows/deploy-to-github-pages.yml`)

- Triggers on: push to main
- Builds with Vite and deploys to GitHub Pages
- Base path handled by `vite.config.js` (uses `/kanbanish/` for GH Pages, `/` otherwise)

## npm Scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` / `start` | `vite --port 3000` | Development server |
| `build` | `vite build` | Production build to `build/` |
| `preview` | `vite preview` | Preview production build |
| `test` | `vitest run` | Run tests once |
| `test:watch` | `vitest` | Tests in watch mode |
| `lint` | `eslint .` | Check lint errors |
| `lint:fix` | `eslint . --fix` | Auto-fix lint errors |
| `lint:check` | `eslint .` | Alias for lint |

## Known Issues & Technical Debt

1. **Firebase config comes from env vars** in `src/utils/firebase.js` (`VITE_FIREBASE_*`) and **throws if any are missing** — local `npm run dev`/`test:e2e` need a `.env` (copy `.env.example`); CI/deploy inject them as secrets. The project is "big-orca" on Firebase. (The web config values are public client config, shipped in the deployed bundle.)
2. **No TypeScript** — all files are `.jsx`. No type checking beyond ESLint.
3. **No routing library** — board ID is managed via query params manually.

## Working on This Codebase

### Adding a New Feature

1. If it needs new Firebase operations → add a new hook in `src/hooks/` or extend an existing one. Wire it into `BoardContext.jsx`.
2. If it only needs existing state → consume `useBoardContext()` directly in your component
3. If it's a new UI element → create component in `src/components/`, add corresponding CSS in `src/styles/components/`
4. If it needs workflow phase awareness → check `workflowUtils.js` for phase permissions
5. Add tests as `ComponentName.test.jsx` (components) or `hookName.test.js` (hooks) alongside the source
6. Run `npm run lint:fix && npm test && npm run build` before committing

### Adding a New Board Template

Templates are defined in `src/data/boardTemplates.js` as a `BOARD_TEMPLATES` array (default export). Each template has `{ id, name, description, columns, icon, tags }`. To add a template:
1. Add a new entry to the `BOARD_TEMPLATES` array in `src/data/boardTemplates.js`
2. The template is automatically available in the template selection modal and via `?template=<id>` URL param
3. The `id` field is the slug used in URLs (e.g., `lean-coffee` → `?template=lean-coffee`)

### Modifying the Firebase Schema

Firebase paths are referenced in the domain hooks (`usePresence`, `useVoting`, `useGroups`, etc.) and in `BoardContext.jsx` (for the main `onValue` listener). When changing the schema:
1. Update the `onValue` listener in `BoardContext.jsx` that reads the data
2. Update the write function(s) in the relevant hook that use `set()` / `remove()`
3. Ensure the data model section above is updated

### Testing Approach

- Mock `BoardContext` with a wrapper that provides test values
- Mock Firebase modules (`src/utils/firebase.js`)
- Use React Testing Library idioms: query by role/text, not implementation details
- Run `npm test` to verify

### Testing Gotchas

- **`window.location` replacement**: When replacing `window.location` in tests (`delete window.location; window.location = {...}`), also mock `window.history.pushState` as a no-op — jsdom throws `DOMException` when `pushState` is called with a replaced location object.
- **Firebase auth mocks**: When testing code that uses `auth.onAuthStateChanged`, the callback should fire asynchronously (`Promise.resolve().then(() => cb(...))`) to avoid `ReferenceError` from variables referenced before the return value is assigned.
- **Always run `npm run build`** in addition to tests — Vite's production build (Rollup) catches import/export errors that Vitest (with its more lenient module resolution) does not. For example, importing a symbol not exported by a module will pass tests but fail the build.
