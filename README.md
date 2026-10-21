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
- ⏱️ **Timers** - global and per-column countdown timers
- 🔍 **Search & filters** - filter by text, tags, color, votes, author, and more
- 📋 **30+ templates** - retro, lean coffee, DAKI, SWOT, sailboat, starfish, and more
- 🎨 **Customizable** - dark/light themes, board backgrounds (solids, gradients, patterns, custom images)
- 📤 **Export** - Markdown, plain text, CSV, or JSON

### Add, group, vote, discuss

Switch the board header from **Board** to a step to take everyone through:

**Health** → **Add** (new cards hidden) → **Group** → **Vote** → **Discuss** → **Poll**

Switch back to **Board** when you're done; groups and votes stay. Works on any board and can be run again.

Plus: one-click board creation from the dashboard or a bookmarkable `?template=<id>` link.
Explicit URL settings override template defaults, for example `?template=default&retro=true` starts at Add.

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
- **CI/CD**: GitHub Actions (lint, test, and build on PR; deploy main only after checks pass)

## 🛠️ Development

### Prerequisites

- Node.js 22
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
| `npm run test:e2e` | `playwright test` | Chromium end-to-end tests |
| `npm run lint` | `eslint .` | Check for lint errors |
| `npm run lint:fix` | `eslint . --fix` | Auto-fix lint errors |

### Testing

Unit tests use isolated worker threads and mock Firebase. Pure utility tests run without jsdom; DOM tests keep their browser environment.

End-to-end tests require Java 21+, emulator tooling (`npm ci --prefix e2e`), and Chromium (`npx playwright install chromium`). Run `npm run test:e2e` to start local Firebase Auth/Realtime Database emulators, build the app, and run Chromium tests with two workers. No `.env`, Firebase login, or cloud credentials are needed. The harness always supplies local demo-project config, refuses to reuse running servers, and stops its servers when done. Ports 3000, 4400, 4500, 9000, and 9099 must be free. Emulator dependencies are installed separately so they do not affect the app's lockfile or unit-test setup.

Each test creates independent boards; different participants use separate browser contexts. Emulator database rules are authenticated test fixtures, not production rules. These tests do not validate production Firebase rules or service availability.

Check stability with `npm run test:e2e -- --repeat-each=5`. Retries are disabled, including in CI, so intermittent failures cannot silently pass.

Use the shared helpers in `e2e/helpers.js` for board and card creation. Wait for user-visible state with Playwright assertions, not fixed sleeps or retries that repeat an action.

PR checks run unit/lint/production-build and emulator e2e jobs in parallel. Main deployment calls the same checks and waits for both to succeed on that commit. Protect `main` by requiring PRs and the `unit-tests` and `e2e-tests` checks, with the branch up to date before merging; workflow files alone do not enforce merge protection.

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
