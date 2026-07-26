import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from './Button';
import Input from './Input';
import FormCard from './FormCard';

describe('Button', () => {
  it('defaults to a full width primary submit button', () => {
    render(<Button text="Save" />);

    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toHaveClass('btn', 'btn-primary', 'w-100');
  });

  it('applies the variant and drops the full width class when disabled', () => {
    render(<Button text="Cancel" type="button" variant="secondary" fullWidth={false} />);

    const button = screen.getByRole('button', { name: 'Cancel' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveClass('btn-secondary');
    expect(button).not.toHaveClass('w-100');
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<Button text="Click me" type="button" onClick={onClick} />);

    await userEvent.click(screen.getByRole('button', { name: 'Click me' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('Input', () => {
  it('renders a required text input wired to its label and value', () => {
    render(
      <Input label="Email" name="email" value="ada@example.com" onChange={() => {}} placeholder="Enter email" />,
    );

    const input = screen.getByPlaceholderText('Enter email');
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveAttribute('name', 'email');
    expect(input).toHaveValue('ada@example.com');
  });

  it('honours the type override', () => {
    render(<Input label="Password" type="password" name="password" value="" onChange={() => {}} placeholder="Enter password" />);

    expect(screen.getByPlaceholderText('Enter password')).toHaveAttribute('type', 'password');
  });

  it('reports each keystroke through onChange with the field name', async () => {
    const onChange = vi.fn();
    render(<Input label="Email" name="email" value="" onChange={onChange} placeholder="Enter email" />);

    await userEvent.type(screen.getByPlaceholderText('Enter email'), 'ab');

    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange.mock.calls[0][0].target.name).toBe('email');
  });
});

describe('FormCard', () => {
  it('renders the title and its children', () => {
    render(
      <FormCard title="Login">
        <p>form body</p>
      </FormCard>,
    );

    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByText('form body')).toBeInTheDocument();
  });
});
