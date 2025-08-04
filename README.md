# Kanbanish

A real-time anonymous Kanban board application built with React and Firebase. Kanbanish allows users to create, share, and collaborate on Kanban boards without requiring accounts or authentication.

## Features

- **Anonymous Access**: No login required – just create a board and share the link
- **Real-time Updates**: Changes appear instantly across all connected users
- **Drag and Drop Interface**: Easily move cards between columns using intuitive drag and drop
- **Card Grouping**: Group related cards together with visual stacking and expand/collapse functionality
- **Emoji Reactions**: Express yourself with emoji reactions on cards
- **Responsive Design**: Works on desktop and mobile devices
- **Customizable Boards**: Create and name columns to fit your workflow

## 🚀 Live Demo

Try Kanbanish at: [https://crittermike.github.io/kanbanish](https://crittermike.github.io/kanbanish)

## 🔧 Technology Stack

- **Frontend**: React 19
- **Build Tool**: Vite
- **State Management**: React Context API
- **Drag and Drop**: react-dnd
- **Backend/Database**: Firebase Realtime Database
- **Authentication**: Firebase Anonymous Auth
- **Testing**: Vitest and React Testing Library
- **Code Quality**: ESLint with React, Accessibility, and Import plugins

## 🛠️ Development

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Getting Started

1. Clone the repository:

```bash
git clone https://github.com/yourusername/kanbanish.git
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

- **Development Server**: `npm run dev` or `npm start`

  - Starts the Vite development server
  - Open [http://localhost:3001/kanbanish/](http://localhost:3001/kanbanish/) in your browser

- **Build for Production**: `npm run build`

  - Builds the app for production to the `build` folder
  - Optimized and ready for deployment

- **Preview Production Build**: `npm run preview`

  - Locally preview the production build

- **Run Tests**: `npm test`
  - Executes the test suite with Vitest

- **Code Linting**: `npm run lint`
  - Checks code for style and quality issues using ESLint
  - Use `npm run lint:fix` to automatically fix fixable issues
  - Use `npm run lint:check` to enforce zero warnings (useful for CI)

## 📱 Using Kanbanish

1. **Creating a Board**:

   - Visit the application and click "Create New Board"
   - Give your board a name and customize columns as needed
   - Share the generated URL with collaborators

2. **Adding Cards**:

   - Click "+" in any column to add a new card
   - Enter a title and description for your card
   - Save to add it to the board

3. **Moving Cards**:

   - Drag and drop cards between columns to update their status

4. **Adding Reactions**:

   - Click the reaction button on any card to add emoji reactions

5. **Grouping Cards**:
   - Select multiple cards by clicking on them
   - Click the group button (📦) in the column header
   - Enter a name for your group and confirm
   - Expand/collapse groups by clicking the group header
   - Ungroup cards using the scissors (✂️) button

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

### Development Guidelines

1. **Code Quality**: Run `npm run lint` before committing to ensure code follows the project's style guidelines
2. **Testing**: Run `npm test` to ensure all tests pass
3. **Type Safety**: Follow TypeScript-like patterns even in JavaScript (proper prop types, clear function signatures)
4. **Accessibility**: Ensure new components follow accessibility best practices

### Contributing Process

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and ensure they follow the style guide (`npm run lint:fix`)
4. Add or update tests as needed
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📬 Contact

Project Link: [https://github.com/yourusername/kanbanish](https://github.com/yourusername/kanbanish)
