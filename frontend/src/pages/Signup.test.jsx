import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import Signup from './Signup';
import Base_URL from '../Utils';

vi.mock('axios');

const renderSignup = () =>
  render(
    <MemoryRouter>
      <Signup />
    </MemoryRouter>,
  );

const fillForm = async () => {
  await userEvent.type(screen.getByPlaceholderText('Enter first name'), 'Ada');
  await userEvent.type(screen.getByPlaceholderText('Enter last name'), 'Lovelace');
  await userEvent.type(screen.getByPlaceholderText('Enter email'), 'ada@example.com');
  await userEvent.type(screen.getByPlaceholderText('Enter password'), 'secret123');
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

describe('Signup', () => {
  it('renders every field and a link to login', () => {
    renderSignup();

    expect(screen.getByRole('heading', { name: 'Sign Up' })).toBeInTheDocument();
    ['Enter first name', 'Enter last name', 'Enter email', 'Enter password'].forEach((placeholder) => {
      expect(screen.getByPlaceholderText(placeholder)).toHaveValue('');
    });
    expect(screen.getByRole('link', { name: 'Login' })).toHaveAttribute('href', '/login');
  });

  it('posts the whole form, shows the success message and resets the fields', async () => {
    axios.post.mockResolvedValue({ data: { message: 'User created successfully' } });

    renderSignup();
    await fillForm();
    await userEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    expect(axios.post).toHaveBeenCalledWith(`${Base_URL}api/v1/signup`, {
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      password: 'secret123',
    });

    expect(await screen.findByText('Signup successful 🎉')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter first name')).toHaveValue('');
    });
    expect(screen.getByPlaceholderText('Enter email')).toHaveValue('');
  });

  it('shows the server error message and keeps the input', async () => {
    axios.post.mockRejectedValue({ response: { data: { message: 'Email already exists..' } } });

    renderSignup();
    await fillForm();
    await userEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    expect(await screen.findByText('Email already exists..')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter email')).toHaveValue('ada@example.com');
  });

  it('falls back to a generic error when the server sends no message', async () => {
    axios.post.mockRejectedValue(new Error('Network Error'));

    renderSignup();
    await fillForm();
    await userEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    expect(await screen.findByText('Signup failed')).toBeInTheDocument();
  });

  it('shows the pending label while the request is in flight', async () => {
    let resolvePost;
    axios.post.mockImplementation(() => new Promise((resolve) => { resolvePost = resolve; }));

    renderSignup();
    await fillForm();
    await userEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    expect(await screen.findByRole('button', { name: 'Signing up...' })).toBeInTheDocument();

    resolvePost({ data: {} });
    expect(await screen.findByRole('button', { name: 'Sign Up' })).toBeInTheDocument();
  });

  it('clears a previous error when the form is resubmitted successfully', async () => {
    axios.post.mockRejectedValueOnce({ response: { data: { message: 'Email already exists..' } } });
    axios.post.mockResolvedValueOnce({ data: { message: 'User created successfully' } });

    renderSignup();
    await fillForm();
    await userEvent.click(screen.getByRole('button', { name: 'Sign Up' }));
    expect(await screen.findByText('Email already exists..')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    expect(await screen.findByText('Signup successful 🎉')).toBeInTheDocument();
    expect(screen.queryByText('Email already exists..')).not.toBeInTheDocument();
  });
});
