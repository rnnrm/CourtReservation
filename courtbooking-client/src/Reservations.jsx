import { useState } from 'react';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import Badge from 'react-bootstrap/Badge';
import Stack from 'react-bootstrap/Stack';
import Calendar from "./Calendar.jsx";
import { getRoleColour } from './Utility.js';

const numCourts = Number(import.meta.env.VITE_NUM_COURTS);
const defaultCourt = Number(import.meta.env.VITE_DEFAULT_COURT) || 1;

const Reservations = ({ user }) => {
    const [key, setKey] = useState(defaultCourt);
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const [reservationToAdd, setReservationToAdd] = useState(null);

    const handleAddReservation = (event) => {
        event.preventDefault();
        setError('');

        if (!user) {
            setError('You must be logged in to create a reservation.');
            return;
        }

        if (!start || !end || !description.trim()) {
            setError('Start, end, and description are required.');
            return;
        }

        if (new Date(start) >= new Date(end)) {
            setError('The end date and time must be after the start date and time.');
            return;
        }

        const reservationId = `${Date.now()}-${key}`;

        setReservationToAdd({
            id: reservationId,
            title: user.name,
            start,
            end,
            allDay: false,
            extendedProps: {
                court: Number(key),
                owner: user.id,
                ownerRole: user.role ?? "Guest",
                description: description.trim()
            },
            backgroundColor: getRoleColour(user.role ?? "Guest")
        });

        setStart('');
        setEnd('');
        setDescription('');
    };

    return (
        <>
            {!user && (
                <p>
                    You must <a href="/">log in</a> to make a reservation.
                </p>
            )}

            <Tabs
                defaultActiveKey={defaultCourt}
                id="court-tabs"
                className="mb-3"
                activeKey={key}
                onSelect={(selectedCourt) => {
                    setKey(Number(selectedCourt));
                    setReservationToAdd(null);
                }}
            >
                {[...Array(numCourts)].map((_, i) => {
                    const court = i + 1;
                    const title = import.meta.env[`VITE_COURT_TITLE${court}`];
                    const courtDescription = import.meta.env[`VITE_COURT_DESCRIPTION${court}`];

                    return (
                        <Tab eventKey={court} title={title} key={court}>
                            <h3>{courtDescription}</h3>
                            <Calendar
                                user={user}
                                court={court}
                                reservationToAdd={court === Number(key) ? reservationToAdd : null}
                            />
                        </Tab>
                    );
                })}
            </Tabs>

            <form onSubmit={handleAddReservation} className="my-4">
                <h4>Add reservation</h4>

                <div className="row g-3">
                    <div className="col-md-4">
                        <label htmlFor="reservation-start" className="form-label">
                            Start
                        </label>
                        <input
                            id="reservation-start"
                            className="form-control"
                            type="datetime-local"
                            value={start}
                            onChange={(event) => setStart(event.target.value)}
                            disabled={!user}
                            required
                        />
                    </div>

                    <div className="col-md-4">
                        <label htmlFor="reservation-end" className="form-label">
                            End
                        </label>
                        <input
                            id="reservation-end"
                            className="form-control"
                            type="datetime-local"
                            value={end}
                            onChange={(event) => setEnd(event.target.value)}
                            disabled={!user}
                            required
                        />
                    </div>

                    <div className="col-md-4">
                        <label htmlFor="reservation-description" className="form-label">
                            Description
                        </label>
                        <input
                            id="reservation-description"
                            className="form-control"
                            type="text"
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            disabled={!user}
                            required
                        />
                    </div>
                </div>

                {error && (
                    <div className="text-danger mt-2" role="alert">
                        {error}
                    </div>
                )}

                <button type="submit" className="btn btn-primary mt-3" disabled={!user}>
                    Add reservation
                </button>
            </form>

            <Stack direction="horizontal" gap={2} className="me-auto my-3">
                <Badge bg="info" className="ms-auto">Member</Badge>
                <Badge bg="danger">Admin</Badge>
                <Badge bg="warning" text="dark" className="me-auto">
                    Guest
                </Badge>
            </Stack>

            <p>Long press a time slot to create, move, or resize a reservation.</p>
        </>);
};

export default Reservations;