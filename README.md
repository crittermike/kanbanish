# Kanbanish

A real-time collaborative kanban board. No accounts, no setup - just create a board, share the link, and go.

🔗 **Try it at [kanbanish.com](https://www.kanbanish.com)**

## ✨ Features

- 🔓 **No login required** - anonymous access, just share the URL
- ⚡ **Real-time sync** - everything updates instantly for all users
- 🖱️ **Drag and drop** - move and reorder cards across columns
- 📦 **Card grouping** - stack related cards together with expand/collapse
- 🗳️ **Voting** - upvotes, downvotes, configurable limits, sort by votes
- 💬 **Comments & reactions** - threaded comments and emoji reactions on any card
- ⏱️ **Timers** - global, per-column, and per-card countdown timers
- 🔍 **Search & filters** - filter by text, tags, color, votes, author, and more
- 📋 **30+ templates** - retro, lean coffee, DAKI, SWOT, sailboat, starfish, and more
- 🎨 **Customizable** - dark/light themes, board backgrounds (solids, gradients, patterns, custom images)
- 📤 **Export** - Markdown, plain text, CSV, or JSON
- 📊 **Board insights** - engagement scores, sentiment analysis, card distribution, top themes

### 🔄 Retrospective Mode

Built-in guided workflow for team retros with sequential phases:

**Health Check** → **Creation** (cards hidden) → **Grouping** → **Voting & Reactions** → **Results** → **Effectiveness Poll**

Plus: action items with assignees and due dates, focus mode for full-screen card presentations, and a board setup wizard to configure everything before you start.

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
- **Always run `npm run build`** in addition to tests - Vite's production build catches import errors that Vitest does not

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📬 Contact

Project Link: [github.com/crittermike/kanbanish](https://github.com/crittermike/kanbanish)
