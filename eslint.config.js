import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  // Base ESLint recommended rules
  js.configs.recommended,
  
  // React recommended rules
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'], // For React 17+ JSX transform
  
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        FormData: 'readonly',
        File: 'readonly',
        Blob: 'readonly',
        FileReader: 'readonly',
        Event: 'readonly',
        CustomEvent: 'readonly',
        EventTarget: 'readonly',
        Node: 'readonly',
        Element: 'readonly',
        HTMLElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
        HTMLSelectElement: 'readonly',
        HTMLFormElement: 'readonly',
        MouseEvent: 'readonly',
        KeyboardEvent: 'readonly',
        TouchEvent: 'readonly',
        DragEvent: 'readonly',
        ClipboardEvent: 'readonly',
        PointerEvent: 'readonly',
        WheelEvent: 'readonly',
        FocusEvent: 'readonly',
        InputEvent: 'readonly',
        ChangeEvent: 'readonly',
        SubmitEvent: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        prompt: 'readonly'
      }
    },
    plugins: {
      'react-hooks': reactHooks,
      import: importPlugin
    },
    rules: {
      // Only the rules you specifically want to override or add
      
      // Custom unused vars pattern (your specific requirement)
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      
      // React configuration
      'react/prop-types': 'off', // Turn off prop-types validation (you had this disabled)
      'react/display-name': 'off', // Turn off display name requirement for inline components
      
      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error', // Your specific requirement: error instead of warn
      
      // Import ordering (your specific style preference)
      'import/order': ['error', {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index'
        ],
        'newlines-between': 'never',
        alphabetize: { order: 'asc', caseInsensitive: true }
      }],
      'import/no-duplicates': 'error',
      'import/newline-after-import': 'error',
      
      // Turn off import resolution (handled by bundler)
      'import/no-unresolved': 'off',
      'import/named': 'off',
      'import/default': 'off',
      'import/namespace': 'off'
    },
    settings: {
      react: {
        version: 'detect'
      }
    }
  },
  {
    files: ['src/**/*.{js,jsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [{
          name: 'firebase/database',
          importNames: ['update'],
          message: 'Use set() and remove() for Firebase writes.'
        }]
      }],
      'no-restricted-syntax': ['error', {
        selector: "ImportNamespaceSpecifier[parent.source.value='firebase/database']",
        message: 'Use named Firebase imports so the set()/remove() write guard applies.'
      }, {
        selector: "ImportExpression[source.value='firebase/database']",
        message: 'Use named Firebase imports so the set()/remove() write guard applies.'
      }]
    }
  },
  {
    // Test files configuration
    files: ['**/*.test.{js,jsx}', '**/__tests__/**/*.{js,jsx}', '**/setupTests.js'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
        jest: 'readonly'
      }
    },
    rules: {
      'no-console': 'off'
    }
  },
  {
    // Config files
    files: ['*.config.{js,mjs}', '.eslintrc.{js,mjs}'],
    languageOptions: {
      sourceType: 'module',
      globals: {
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        require: 'readonly'
      }
    }
  },
  {
    // Ignore patterns
    ignores: [
      'dist/',
      'build/',
      'build-e2e/',
      'node_modules/',
      '*.min.js',
      'public/manifest.json',
      'coverage/',
      'test-results/',
      'playwright-report/',
      '.vscode/',
      '.git/'
    ]
  }
];
