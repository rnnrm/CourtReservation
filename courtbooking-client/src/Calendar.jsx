import { useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from "@fullcalendar/interaction";
import { post, getRoleColour } from './Utility.js';

export default function Calendar({ user, court, reservationToAdd }) {
    const calendarRef = useRef(null);
    const lastAddedReservationId = useRef(null);

    let serverUrl = import.meta.env.VITE_DEV_SERVER_PORT
        ? `http://localhost:${import.meta.env.VITE_DEV_SERVER_PORT}/`
        : "";

    useEffect(() => {
        if (!reservationToAdd || !calendarRef.current) {
            return;
        }

        if (lastAddedReservationId.current === reservationToAdd.id) {
            return;
        }

        const calendarApi = calendarRef.current.getApi();
        const events = calendarApi.getEvents();
        if (events.some((event) => (
            reservationToAdd.start < event.end &&
            reservationToAdd.end > event.start &&
            Number(event.extendedProps?.court) === Number(court) &&
            !isGuestReservation(event)
        ))) {
            alert("Time slot already taken for court " + court);
            return;
        }

        calendarApi.addEvent(
            reservationToAdd,
            'backendServerEventSourceId'
        );

        lastAddedReservationId.current = reservationToAdd.id;

    }, [reservationToAdd]);

    function isGuestReservation(event) {
        return event.extendedProps?.ownerRole === "Guest";
    }

    const updateData = (data, action) => {
        if (data.event.extendedProps.owner !== user.id &&
            user.role !== "Admin") {
            return;
        }

        const booking = {
            Id: data.event.id,
            Title: data.event.title,
            Start: data.event.startStr,
            End: data.event.endStr,
            AllDay: data.event.allDay,
            ClassName: data.event.classNames.join(" "),
            ExtendedProps: {
                ...data.event.extendedProps,
                ownerRole: data.event.extendedProps.ownerRole
            },
            BackgroundColor: data.event.backgroundColor
        };

        switch (action) {
            case '+':
                post('api/Bookings', booking, i => JSON.stringify(i), "POST");
                break;
            case '-':
                post(
                    'api/Bookings',
                    {
                        BookingId: booking.Id,
                        UserId: booking.ExtendedProps.owner
                    },
                    i => JSON.stringify(i),
                    "DELETE"
                );
                break;
            case '=':
                post('api/Bookings', booking, i => JSON.stringify(i), "PUT");
                break;
        }
    };

    function handleDateSelect(selectInfo) {
        const calendarApi = selectInfo.view.calendar;
        const events = calendarApi.getEvents();
        const title = user.name;

        calendarApi.unselect();

        if (events.some((event) => (
            selectInfo.start < event.end &&
            selectInfo.end > event.start &&
            Number(event.extendedProps?.court) === Number(court) &&
            !isGuestReservation(event)
        ))) {
            alert("Time slot already taken for court " + court);
            return;
        }

        if (title) {
            const ownerRole = user.role ?? "Guest";

            calendarApi.addEvent({
                id: `${Date.now()}-${court}`,
                title,
                start: selectInfo.startStr,
                end: selectInfo.endStr,
                allDay: selectInfo.allDay,
                extendedProps: {
                    court,
                    owner: user.id,
                    ownerRole,
                    description: ""
                },
                backgroundColor: getRoleColour(ownerRole)
            }, 'backendServerEventSourceId');
        }
    }

    function handleEventAllow(dropInfo, draggedEvent) {
        return draggedEvent.extendedProps.owner === user.id ||
            user.role === "Admin";
    }

    function handleEventClick(eventInfo) {
        if (user && (
            eventInfo.event.extendedProps.owner === user.id ||
            user.role === "Admin"
        )) {
            if (confirm(`Are you sure you want to delete the event
${eventInfo.event.title}
From ${eventInfo.event.startStr}
To ${eventInfo.event.endStr}
${eventInfo.event.extendedProps.description ?? ''}`)) {
                eventInfo.event.remove();
            }
        } else {
            alert(`Booking by ${eventInfo.event.title}
From ${eventInfo.event.startStr}
To ${eventInfo.event.endStr}
${eventInfo.event.extendedProps.description ?? ''}`);
        }
    }

    function handleEventContent(eventInfo) {
        const description = eventInfo.event.extendedProps?.description;

        return (
            <div
                className="fc-event-content"
                title={description || eventInfo.event.title}
            >
                <div>
                    {eventInfo.timeText} {eventInfo.event.title}
                </div>

                {description && (
                    <div className="fc-event-description">
                        {description}
                    </div>
                )}
            </div>
        );
    }
    

    return (
        <FullCalendar
            ref={calendarRef}
            timeZone="UTC"
            themeSystem="bootstrap5"
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            events={{
                id: 'backendServerEventSourceId',
                url: serverUrl + 'api/Bookings',
                extraParams: {
                    court
                }
            }}
            headerToolbar={{
                left: 'prev,next',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            editable={user !== null}
            selectable={user !== null}
            select={handleDateSelect}
            selectMirror
            eventClick={handleEventClick}
            eventContent={handleEventContent}
            eventAllow={handleEventAllow}
            eventOverlap={false}
            eventAdd={(value) => updateData(value, '+')}
            eventChange={(value) => updateData(value, '=')}
            eventRemove={(value) => updateData(value, '-')}
            contentHeight={500}
            firstDay="1"
            slotMinTime="05:00:00"
            slotMaxTime="19:00:00"
            views={{
                week: {
                    dayHeaderFormat: { weekday: 'short' }
                }
            }}
        />
    );
}