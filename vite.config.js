import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Set up any path aliases you might need
      '@': path.resolve(__dirname, './src')
    },
    extensions: ['.js', '.jsx', '.json']
  },
  // Configure esbuild to handle JSX in .js files
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: []
  },
  // Configure to support GitHub Pages deployment with custom domain or regular pages depending on environment variable
  base: process.env.NODE_ENV === 'production'
    ? (process.env.GITHUB_PAGES ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/` : '/')
    : '/',
  build: {
    outDir: 'build'  // Same output directory as Create React App for consistency
  },
  // Configure server settings
  server: {
    port: 3000, // Same port as CRA uses by default
    open: true // Automatically open browser
  }
});
