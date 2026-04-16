/* eslint-env vitest */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

describe('App component', () => {
    afterEach(() => {
        // restore navigator.onLine to default (true) after each test
        Object.defineProperty(window.navigator, 'onLine', { value: true, configurable: true });
    });

  it('renders navbar and shows OFFLINE when offline prop is true', () => {
    render(
      <MemoryRouter>
        <App offline={true} />
      </MemoryRouter>
    );

    // Brand contains OFFLINE
    expect(screen.getByRole('link', { name: /Tennis Club/i })).toHaveTextContent(/OFFLINE/i);

    // Nav links present (use role queries)
    expect(screen.getByRole('link', { name: /Book court/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Account/i })).toBeInTheDocument();
  });

  it('renders without offline text when offline is false', () => {
    render(
      <MemoryRouter>
        <App offline={false} />
      </MemoryRouter>
    );

    expect(screen.queryByText(/OFFLINE/i)).toBeNull();
  });

  it('shows "You are currently offline" when navigator.onLine is false', () => {
    Object.defineProperty(window.navigator, 'onLine', { value: false, configurable: true });

    render(
      <MemoryRouter>
        <App offline={true} />
      </MemoryRouter>
    );

    expect(screen.getByText(/You are currently offline/i)).toBeInTheDocument();
  });

  it('shows "Server is offline" when navigator.onLine is true', () => {
    Object.defineProperty(window.navigator, 'onLine', { value: true, configurable: true });

    render(
      <MemoryRouter>
        <App offline={true} />
      </MemoryRouter>
    );

    expect(screen.getByText(/Server is offline/i)).toBeInTheDocument();
  });
});