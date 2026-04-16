import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { vi } from 'vitest';

// Mock react-router-dom useParams before importing the component
vi.mock('react-router-dom', () => {
  return {
    useParams: () => ({ competitionName: 'Comp1' })
  };
});

// Mock MatchReport to keep tests focused on Ladder rendering
vi.mock('../MatchReport.jsx', () => {
  return {
    default: () => <div data-testid="match-report-mock">MatchReportMock</div>
  };
});

// Utility.post will be customized per-test via vi.fn()
vi.mock('../Utility.js', () => {
  return {
    post: vi.fn()
  };
});

import Ladder from '../Ladder';
import { post } from '../Utility.js';

describe('Ladder component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders competitors with correct ranks and shows MatchReport for Member', async () => {
    const competitors = [
      { Id: 1, players: [{ userName: 'Alice' }], type: 'singles', rating: 200 },
      { Id: 2, players: [{ userName: 'Bob' }], type: 'singles', rating: 180 },
      { Id: 3, players: [{ userName: 'Carol' }], type: 'singles', rating: 180 },
      { Id: 4, players: [{ userName: 'Dave' }], type: 'singles', rating: 150 }
    ];

    // matchResults and pendingResults empty for this test
    const matchResults = [];
    const pendingResults = [];

    // Implement post to return appropriate responses based on URL
    post.mockImplementation((url) => {
      if (url.startsWith('/api/Ladder/Competitors')) {
        return Promise.resolve({ ok: true, json: async () => competitors });
      }
      if (url.startsWith('/api/Ladder/Results')) {
        return Promise.resolve({ ok: true, json: async () => matchResults });
      }
      if (url.startsWith('/api/Ladder/PendingResults')) {
        return Promise.resolve({ ok: true, json: async () => pendingResults });
      }
      return Promise.resolve({ ok: false });
    });

    const user = { id: 10, role: 'Member' };
    render(<Ladder user={user} />);

    // Wait for the first competitor name to appear
    expect(await screen.findByText('Alice')).toBeInTheDocument();

    // Header row + 4 data rows = 5 rows
    const rows = await screen.findAllByRole('row');
    expect(rows.length).toBeGreaterThanOrEqual(5);

    // Data rows are rows[1..4]
    const dataRows = rows.slice(1, 1 + competitors.length);
    // Expected ranks: 1,2,2,3 (per component ranking logic)
    const expectedRanks = ['1', '2', '2', '3'];

    dataRows.forEach((row, idx) => {
      const cells = within(row).getAllByRole('cell');
      // first cell is rank
      expect(cells[0].textContent.trim()).toBe(expectedRanks[idx]);
      // second cell contains player name
      expect(cells[1].textContent).toContain(competitors[idx].players[0].userName);
      // third cell contains rating
      expect(cells[2].textContent).toContain(String(competitors[idx].rating));
    });

    // MatchReport should be rendered for Member
    expect(screen.getByTestId('match-report-mock')).toBeInTheDocument();
  });

  it('shows latest results and pending results sections when APIs return data', async () => {
    const competitors = [];
    const matchResults = [
      { winner1: 'W1', winner2: null, loser1: 'L1', loser2: null, pointsChange: 5, score: '6-4', datePlayed: '2026-03-01' },
      { winner1: 'W2', winner2: null, loser1: 'L2', loser2: null, pointsChange: 3, score: '6-3', datePlayed: '2026-03-02' }
    ];
    const pendingResults = [
      { winner1: 'P1', winner2: null, loser1: 'P2', loser2: null, score: '6-0', datePlayed: '2026-02-28', reportedBy: 'Reporter' }
    ];

    post.mockImplementation((url) => {
      if (url.startsWith('/api/Ladder/Competitors')) {
        return Promise.resolve({ ok: true, json: async () => competitors });
      }
      if (url.startsWith('/api/Ladder/Results')) {
        return Promise.resolve({ ok: true, json: async () => matchResults });
      }
      if (url.startsWith('/api/Ladder/PendingResults')) {
        return Promise.resolve({ ok: true, json: async () => pendingResults });
      }
      return Promise.resolve({ ok: false });
    });

    const user = { id: 20, role: 'Member' };
    render(<Ladder user={user} />);

    // Latest results heading appears
    expect(await screen.findByText(/Latest results/i)).toBeInTheDocument();
    // Verify presence of elements from matchResults
    expect(screen.getByText(/\+5/)).toBeInTheDocument();
    expect(screen.getByText('6-4')).toBeInTheDocument();
    expect(screen.getByText(/W1/)).toBeInTheDocument();

    // Pending results heading appears
    expect(await screen.findByText(/Results awaiting confirmation/i)).toBeInTheDocument();
    // Verify reportedBy text is present
    expect(screen.getByText(/reported by Reporter/i)).toBeInTheDocument();
  });

  it('does not show MatchReport when user is not Member', async () => {
    post.mockResolvedValue({ ok: true, json: async () => [] });

    const adminUser = { id: 1, role: 'Admin' };
    render(<Ladder user={adminUser} />);

    // Wait for component to fetch and render (no MatchReport expected)
    await screen.findAllByRole('row'); // at minimum header row will exist

    // MatchReport mock should not be present for Admin
    const mr = screen.queryByTestId('match-report-mock');
    expect(mr).toBeNull();
  });
});