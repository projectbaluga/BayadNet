import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Dashboard from '../pages/Dashboard';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: [] })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

// Mock socket
vi.mock('../utils/socket', () => ({
  socket: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  },
}));

// Mock window.scrollTo
window.scrollTo = vi.fn();

describe('Dashboard Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders login screen when no token is present', () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    expect(screen.getByText(/Welcome Back/i)).toBeInTheDocument();
  });
});
