import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Kanbanish app correctly', () => {
  render(<App />);
  const appElement = document.querySelector('.App');
  expect(appElement).toBeInTheDocument();
});
