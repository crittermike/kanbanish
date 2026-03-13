# Kanbanish

A real-time collaborative kanban board built with React and Firebase. No accounts, no setup — just create a board, share the link, and start collaborating. Great for retrospectives, brainstorming, lean coffee, sprint planning, and more.

🔗 **Live at [kanbanish.com](https://www.kanbanish.com)**

## Features

### Core Board

- **No login required** — fully anonymous via Firebase Anonymous Auth
- **Real-time collaboration** — all changes sync instantly across connected users
- **Drag and drop** — move cards between columns with react-dnd
- **Card grouping** — group related cards with visual stacking and expand/collapse
- **Card detail modal** — click any card to open a two-column detail view with voting, reactions, comments, color, tags, and a per-card timer
- **Focus mode** — full-screen card presentation with keyboard navigation, auto-play, and a progress minimap
- **30+ board templates** — retro, lean coffee, DAKI, SWOT, sailboat, starfish, and many more (or build your own)
- **Board creation wizard** — pick a template, choose Kanban or Retrospective mode, and toggle features before starting

### Retrospective Workflow

When retrospective mode is enabled, the board walks through guided phases:

1. **Health Check** — team rates areas (morale, tech debt, focus, etc.) on a 1–5 scale
2. **Health Check Results** — aggregate ratings revealed
3. **Creation** — participants add cards (content hidden from others)
4. **Grouping** — cards revealed; drag to group related ideas
5. **Interactions** — vote, comment, and react on cards (hidden until reveal)
6. **Interaction Reveal** — all votes, comments, and reactions become visible
7. **Results** — top-voted items displayed
8. **Poll** — rate the retrospective's effectiveness (1–5 stars)
9. **Poll Results** — poll ratings displayed

### Voting

- Upvotes and optional downvotes
- Configurable vote limits per person (unlimited, 3, 5, 10, or custom)
- Toggle multiple votes per card
- Sort cards by votes or chronologically
- One-click vote reset

### Timers

- **Global board timer** with presets (1m, 3m, 5m, 10m) or custom duration
- **Per-column timers** — set a default timer for any column; one click to start
- **Per-card timer** — available inside the card detail modal
- Audio notification when time expires

### Search & Filters

- Full-text search across card content
- Filter by tags, author (own cards), vote count, card color, comments, reactions, or grouping status
- Active filter chips with one-click removal

### Action Items

- Convert cards into trackable action items with assignee, due date, and status
- Open/done toggle, overdue flagging, inline editing
- Summary panel with completion stats

### Board Insights

- Overview stats: total cards, votes, comments, reactions, unique authors, groups
- Engagement score (0–100) based on comment, voting, and reaction activity
- Sentiment analysis with score and label
- Card distribution per column
- Top themes (word frequency), top voted, most discussed, most reacted
- Action items completion progress

### Customization

- **Themes**: dark and light mode
- **Board backgrounds**: solid colors, gradients, patterns, or a custom image URL (with tile/cover sizing)
- **Display names**: optionally show author names and avatars on cards

### Sharing & Export

- One-click share URL
- Export to **Markdown**, **Plain Text**, **CSV**, or **JSON** with preview and copy-to-clipboard
- Exports include votes, comments, reactions, tags, colors, and group structure

### Other

- **Emoji reactions** on cards and groups with keyword search
- **Emoji autocomplete** — type `:shortcode:` (e.g. `:heart:`) in card or comment inputs
- **Comments** on cards and groups with inline editing and markdown support
- **Card colors and tags** for visual organization
- **User presence** — see who's currently on the board
- **Recent boards** — dashboard shows recent and pinned boards
- **Responsive design** — works on desktop and mobile
- **URL configuration** — pre-configure boards via query params (e.g. `?template=lean-coffee&voting=true&votes=5&theme=dark`)

## 🔧 Technology Stack

- **Frontend**: React 19 (JSX, no TypeScript)
- **Build Tool**: Vite
- **State Management**: React Context API
- **Drag and Drop**: react-dnd (HTML5 backend)
- **Backend/Database**: Firebase Realtime Database
- **Authentication**: Firebase Anonymous Auth
- **Styling**: Pure CSS with custom properties (no Tailwind, no CSS-in-JS)
- **Testing**: Vitest + React Testing Library
- **Linting**: ESLint with react, react-hooks, import, and jsx-a11y plugins
- **CI/CD**: GitHub Actions (test on PR, auto-deploy to GitHub Pages on push to main)

## 🛠️ Development

### Prerequisites

- Node.js (v18 or higher recommended)
- npm

### Getting Started

1. Clone the repository:

```bash
git clone https://github.com/crittermike/kanbanish.git
cd kanbanish
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory and add your Firebase configuration:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_DATABASE_URL=your_database_url
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Available Scripts

| Script | Command | Purpose |
|---|---|---|
| `npm run dev` | `vite --port 3000` | Development server at [localhost:3000](http://localhost:3000) |
| `npm run build` | `vite build` | Production build to `build/` |
| `npm run preview` | `vite preview` | Preview production build |
| `npm test` | `vitest run` | Run tests once |
| `npm run test:watch` | `vitest` | Tests in watch mode |
| `npm run lint` | `eslint .` | Check for lint errors |
| `npm run lint:fix` | `eslint . --fix` | Auto-fix lint errors |

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Run `npm run lint:fix && npm test && npm run build` before committing
4. Open a Pull Request

### Development Guidelines

- **Code Quality**: Run `npm run lint` to ensure code follows the project's style guidelines
- **Testing**: Add tests as `ComponentName.test.jsx` alongside components; run `npm test` to verify
- **Accessibility**: Follow jsx-a11y best practices for new components
- **Always run `npm run build`** in addition to tests — Vite's production build catches import errors that Vitest does not

## 📄 License

This project is licensed under the MIT License — see the LICENSE file for details.

## 📬 Contact

Project Link: [github.com/crittermike/kanbanish](https://github.com/crittermike/kanbanish)
