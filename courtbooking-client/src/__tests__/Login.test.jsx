/* eslint-env vitest */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../Login';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// Mock the post utility used by Login
vi.mock('../Utility.js', () => {
  return {
    post: vi.fn(() => Promise.resolve({ ok: true }))
  };
});

describe('Login component (when user is present)', () => {
  it('shows Logout button and calls setUser(null) after logout', async () => {
    const setUser = vi.fn();
      render(
          <MemoryRouter>
              <Login user={{ id: 1, name: 'Test', role: 'Member' }} setUser={setUser} />
          </MemoryRouter>);

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    await userEvent.click(logoutButton);

    // setUser is called to clear the user
    expect(setUser).toHaveBeenCalledWith(null);

    // After logout Login shows the logged-out message
    expect(await screen.findByText(/Logged out\./i)).toBeInTheDocument();
  });
});