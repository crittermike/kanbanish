import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 2,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 60000,
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'node e2e/node_modules/firebase-tools/lib/bin/firebase.js emulators:start --project demo-kanbanish --config e2e/firebase.json --only auth,database',
      wait: { stdout: /All emulators ready/ },
      reuseExistingServer: false,
      timeout: 180000,
      stdout: 'pipe',
      gracefulShutdown: { signal: 'SIGINT', timeout: 10000 },
      env: { JAVA_TOOL_OPTIONS: '-Xmx512m' },
    },
    {
      command: 'vite build --mode e2e --outDir build-e2e && vite preview --outDir build-e2e --host 127.0.0.1 --port 3000 --strictPort',
      url: 'http://127.0.0.1:3000',
      reuseExistingServer: false,
      timeout: 60000,
      env: {
        VITE_FIREBASE_EMULATORS: 'true',
        VITE_FIREBASE_API_KEY: 'fake-api-key',
        VITE_FIREBASE_AUTH_DOMAIN: 'demo-kanbanish.firebaseapp.com',
        VITE_FIREBASE_PROJECT_ID: 'demo-kanbanish',
        VITE_FIREBASE_DATABASE_URL: 'http://127.0.0.1:9000?ns=demo-kanbanish-default-rtdb',
        VITE_FIREBASE_APP_ID: 'demo-app-id',
        VITE_FIREBASE_STORAGE_BUCKET: '',
        VITE_FIREBASE_MESSAGING_SENDER_ID: '',
      },
    },
  ],
});
