import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import Login from './Login';
import Base_URL from '../Utils';

vi.mock('axios');

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  );

const fillForm = async () => {
  await userEvent.type(screen.getByPlaceholderText('Enter email'), 'ada@example.com');
  await userEvent.type(screen.getByPlaceholderText('Enter password'), 'secret123');
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

describe('Login', () => {
  it('renders the login form and a link to signup', () => {
    renderLogin();

    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter email')).toHaveValue('');
    expect(screen.getByPlaceholderText('Enter password')).toHaveValue('');
    expect(screen.getByRole('link', { name: 'Sign Up' })).toHaveAttribute('href', '/signup');
  });

  it('tracks typed input in state', async () => {
    renderLogin();
    await fillForm();

    expect(screen.getByPlaceholderText('Enter email')).toHaveValue('ada@example.com');
    expect(screen.getByPlaceholderText('Enter password')).toHaveValue('secret123');
  });

  it('posts the credentials to the login endpoint and clears the form', async () => {
    axios.post.mockResolvedValue({ data: { message: 'Login successful', token: 'jwt' } });

    renderLogin();
    await fillForm();
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));

    expect(axios.post).toHaveBeenCalledWith(`${Base_URL}api/v1/login`, {
      email: 'ada@example.com',
      password: 'secret123',
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter email')).toHaveValue('');
    });
    expect(screen.getByPlaceholderText('Enter password')).toHaveValue('');
  });

  it('keeps the entered credentials when the request fails', async () => {
    axios.post.mockRejectedValue({ response: { data: { message: 'Invalid email or password' } } });

    renderLogin();
    await fillForm();
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByPlaceholderText('Enter email')).toHaveValue('ada@example.com');
  });

  it('handles a network error without a response body', async () => {
    axios.post.mockRejectedValue(new Error('Network Error'));

    renderLogin();
    await fillForm();
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });
});
