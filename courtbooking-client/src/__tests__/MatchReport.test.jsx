/* eslint-env vitest */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MatchReport from '../MatchReport';
import { vi } from 'vitest';

// Mock post to satisfy requests from MatchReport
vi.mock('../Utility.js', () => {
  return {
    post: vi.fn(() => Promise.resolve({ ok: true, json: async () => ({}) }))
  };
});

// Mock useParams from react-router to provide competitionName
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ competitionName: 'Singles Ladder' })
  };
});

describe('MatchReport component', () => {
  it('opens Record match modal when button clicked', async () => {
    render(<MatchReport user={{ id: 1, name: 'User', role: 'Member' }} updateDisplay={vi.fn()} />);

    const recordButton = screen.getByRole('button', { name: /record match result/i });
    await userEvent.click(recordButton);

    // Modal title
    expect(await screen.getByRole('heading', { name: /Record match result/i })).toBeInTheDocument();
  });
});