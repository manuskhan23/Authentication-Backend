import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import Base_URL from './Utils';

vi.mock('axios');

describe('App routing', () => {
  it('redirects the root path to the signup page', () => {
    window.history.pushState({}, '', '/');
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Sign Up' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/signup');
  });

  it('renders the login page on /login', () => {
    window.history.pushState({}, '', '/login');
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
  });

  it('navigates between signup and login', async () => {
    window.history.pushState({}, '', '/signup');
    render(<App />);

    await userEvent.click(screen.getByRole('link', { name: 'Login' }));
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: 'Sign Up' }));
    expect(screen.getByRole('heading', { name: 'Sign Up' })).toBeInTheDocument();
  });
});

describe('Base_URL', () => {
  it('is an absolute https url with a trailing slash so paths can be appended', () => {
    expect(Base_URL).toMatch(/^https:\/\/.+\/$/);
    expect(`${Base_URL}api/v1/login`).not.toContain('//api');
  });
});
