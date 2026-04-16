import React from 'react';
import { render } from '@testing-library/react';
import { vi } from 'vitest';

let receivedProps = null;

// Mock FullCalendar so tests can inspect the props and call handlers directly
vi.mock('@fullcalendar/react', () => {
  return {
    default: (props) => {
      receivedProps = props;
      return <div data-testid="fullcalendar" />;
    }
  };
});

// Mock post utility used inside Calendar.updateData
vi.mock('../Utility.js', () => {
  return {
    post: vi.fn()
  };
});

import Calendar from '../Calendar';
import { post } from '../Utility.js';

describe('Calendar', () => {
  beforeEach(() => {
    receivedProps = null;
    vi.clearAllMocks();
  });

  it('passes editable/selectable true when user present and triggers POST on eventAdd for owner', () => {
    const user = { username: 'blah', id: 123, name: 'blah', role: 'Member' };
    render(<Calendar user={user} court={1} />);

    expect(receivedProps).not.toBeNull();
    expect(receivedProps.editable).toBe(true);
    expect(receivedProps.selectable).toBe(true);

    const eventObj = {
      id: 'evt1',
      title: 'Test Event',
      startStr: '2026-03-04T10:00:00Z',
      endStr: '2026-03-04T11:00:00Z',
      allDay: false,
      classNames: ['classA'],
      extendedProps: { owner: 123, description: '' },
      backgroundColor: 'hsl(190, 50%, 50%)'
    };

    // Simulate FullCalendar calling eventAdd
    receivedProps.eventAdd({ event: eventObj });

    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith(
      'api/Bookings',
      expect.objectContaining({ Id: eventObj.id, Title: eventObj.title }),
      expect.any(Function),
      'POST'
    );
  });

  it('does not call POST on eventAdd/eventChange/eventRemove when user is not owner and not admin', () => {
    const user = { username: 'blah', id: 999, role: 'Member' };
    render(<Calendar user={user} court={1} />);

    expect(receivedProps).not.toBeNull();
    expect(receivedProps.editable).toBe(true);

    const eventObj = {
      id: 'evt2',
      title: 'Other Event',
      startStr: '2026-03-05T10:00:00Z',
      endStr: '2026-03-05T11:00:00Z',
      allDay: false,
      classNames: [],
      extendedProps: { owner: 123, description: '' },
      backgroundColor: 'hsl(190,50%,50%)'
    };

    receivedProps.eventAdd({ event: eventObj });
    receivedProps.eventChange({ event: eventObj });
    receivedProps.eventRemove({ event: eventObj });

    expect(post).not.toHaveBeenCalled();
  });

  it('admin can add/change/remove bookings for other owners (POST/PUT/DELETE)', () => {
    const admin = { username: 'admin', id: 999, role: 'Admin' };
    render(<Calendar user={admin} court={1} />);

    expect(receivedProps).not.toBeNull();

    const eventObj = {
      id: 'evt3',
      title: 'Someone Else Event',
      startStr: '2026-03-06T08:00:00Z',
      endStr: '2026-03-06T09:00:00Z',
      allDay: false,
      classNames: ['c'],
      extendedProps: { owner: 123, description: 'desc' },
      backgroundColor: 'hsl(190,50%,50%)'
    };

    receivedProps.eventAdd({ event: eventObj });
    receivedProps.eventChange({ event: eventObj });
    receivedProps.eventRemove({ event: eventObj });

    // POST for add
    expect(post).toHaveBeenCalledWith(
      'api/Bookings',
      expect.objectContaining({ Id: eventObj.id, Title: eventObj.title }),
      expect.any(Function),
      'POST'
    );

    // PUT for change
    expect(post).toHaveBeenCalledWith(
      'api/Bookings',
      expect.objectContaining({ Id: eventObj.id, Title: eventObj.title }),
      expect.any(Function),
      'PUT'
    );

    // DELETE for remove: payload contains BookingId and UserId (owner)
    expect(post).toHaveBeenCalledWith(
      'api/Bookings',
      expect.objectContaining({ BookingId: eventObj.id, UserId: eventObj.extendedProps.owner }),
      expect.any(Function),
      'DELETE'
    );
  });

  it('owner with Guest role can modify their own bookings (PUT/DELETE)', () => {
    const guestOwner = { username: 'guest', id: 555, role: 'Guest' };
    render(<Calendar user={guestOwner} court={1} />);

    expect(receivedProps).not.toBeNull();

    const eventObj = {
      id: 'evt4',
      title: 'Guest Own Event',
      startStr: '2026-03-07T12:00:00Z',
      endStr: '2026-03-07T13:00:00Z',
      allDay: false,
      classNames: [],
      extendedProps: { owner: 555, description: '' },
      backgroundColor: 'hsl(60, 50%, 50%)' // guest color (if relevant)
    };

    receivedProps.eventChange({ event: eventObj });
    receivedProps.eventRemove({ event: eventObj });

    expect(post).toHaveBeenCalledWith(
      'api/Bookings',
      expect.objectContaining({ Id: eventObj.id, Title: eventObj.title }),
      expect.any(Function),
      'PUT'
    );

    expect(post).toHaveBeenCalledWith(
      'api/Bookings',
      expect.objectContaining({ BookingId: eventObj.id, UserId: eventObj.extendedProps.owner }),
      expect.any(Function),
      'DELETE'
    );
  });

  it('passes editable/selectable false when user is null', () => {
    render(<Calendar user={null} court={1} />);

    expect(receivedProps).not.toBeNull();
    expect(receivedProps.editable).toBe(false);
    expect(receivedProps.selectable).toBe(false);
  });
});