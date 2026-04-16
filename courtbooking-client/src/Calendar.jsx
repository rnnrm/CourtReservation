

import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from "@fullcalendar/interaction" // needed for dayClick
import { post } from './Utility.js';
export default function Calendar({ user, court }) {
/*
    const recurringReservation = (event) => {

        let calendarApi = selectInfo.view.calendar;
        var events = calendarApi.getEvents();
        let title = user.name;

        calendarApi.unselect() // clear date selection
        if (events.some(function (event) {
            return (
                selectInfo.start < event.end && selectInfo.end > event.start
                && Number(event.extendedProps?.court) === Number(court)
                && !isGuestReservation(event)
            );
        })) {
            alert("Time slot already taken for court " + court);
            return;
        }
        let hue = user.role == "Admin" ? 360 :
            user.role == "Member" ? 190 : 60;
        //const hue = Math.floor(court / 6.0 * 360.0);
        let colour = "hsl(" + hue + ", 50%, 50%)"
        if (title) {
            calendarApi.addEvent({
                id: new Date().getTime() + "-" + court,
                title,
                //start: selectInfo.startStr,
                //end: selectInfo.endStr,
                //allDay: selectInfo.allDay,
                extendedProps: { court: court, owner: user.Id, description: "" },
                backgroundColor: colour,
                daysOfWeek: event.daysOfWeek,
                startTime: event.startTime,
                endTime: event.endTime,
                startRecur: event.startRecur,
                endRecur: event.endRecur,
                groupId: event.groupId
            }, 'backendServerEventSourceId')
        }
    };*/

    function isGuestReservation(res) {
        const guestColour = "hsl(60, 50%, 50%)";
        return res.backgroundColor === guestColour;
    }

    const updateData = (data, action) => {

        if (data.event.extendedProps.owner !== user.id &&
            user.role !== "Admin") return; // only allow owner to modify booking

        let booking = {
            Id: data.event.id,
            Title: data.event.title,
            Start: data.event.startStr,
            End: data.event.endStr,
            AllDay: data.event.allDay,
            ClassName: data.event.classNames.join(" "),
            ExtendedProps: { ...data.event.extendedProps },
            BackgroundColor: data.event.backgroundColor,

            //DaysOfWeek: data.event.daysOfWeek,
            //StartTime: data.event.startTime,
            //EndTime: data.event.endTime,
            //StartRecur: data.event.startRecur,
            //EndRecur: data.event.endRecur,
            //GroupId: data.event.groupId
        };
        switch (action) {
            case '+':
                post('api/Bookings', booking, i => JSON.stringify(i), "POST");
                break;
            case '-':
                post('api/Bookings', { BookingId: booking.Id, UserId: booking.ExtendedProps.owner }, i => JSON.stringify(i), "DELETE");
                break;
            case '=':
                post('api/Bookings', booking, i => JSON.stringify(i), "PUT");
                break;
        }
    }

    function handleDateSelect(selectInfo) {
        let calendarApi = selectInfo.view.calendar;
        var events = calendarApi.getEvents();

        let title = user.name;

        calendarApi.unselect() // clear date selection
        if (events.some(function (event) {
            return (
                selectInfo.start < event.end && selectInfo.end > event.start
                && Number(event.extendedProps?.court) === Number(court)
                && !isGuestReservation(event)
            );
        })) {
            alert("Time slot already taken for court " + court);
            return;
        }

        let hue = user.role == "Admin" ? 360 :
            user.role == "Member" ? 190 : 60;
        //const hue = Math.floor(court / 6.0 * 360.0);
        let colour = "hsl(" + hue + ", 50%, 50%)"
        if (title) {
            calendarApi.addEvent({
                id: new Date().getTime() + "-" + court,
                title,
                start: selectInfo.startStr,
                end: selectInfo.endStr,
                allDay: selectInfo.allDay,
                extendedProps: { court: court, owner: user.id, description: "" },
                backgroundColor: colour
            }, 'backendServerEventSourceId')
        }
    }

    function handleAllowSelect(eventInfo) {
        //console.log('handleAllowSelect',eventInfo.event.extendedProps.owner, user.Id);
        if (eventInfo.event.extendedProps.owner !== user.id &&
            user.role !== "Admin") return false; // only allow owner to modify booking)
        return true;
    }
    function handleEventAllow(dropInfo, draggedEvent) {
        //console.log('handleEventAllow ', draggedEvent, dropInfo);
        if (draggedEvent.extendedProps.owner !== user.id &&
            user.role !== "Admin") return false; // only allow owner to modify booking)
        return true;
    }

    function handleEventClick(eventInfo) {
        //if (isGuestReservation(eventInfo.event) && user?.role !== "Guest")
        //    return handleDateSelect(eventInfo);

        // only allow owner or admin to delete booking or if its a guest reservation
        if (user && (eventInfo.event.extendedProps.owner === user?.id
            || user?.role === "Admin"
            //|| isGuestReservation(eventInfo.event)  && user?.role !== "Guest")
        )) {
            if (confirm(`Are you sure you want to delete the event \n${eventInfo.event.title} From \n${eventInfo.event.startStr} \nto \n${eventInfo.event.endStr} \n${eventInfo.event.extendedProps.description ?? ''}`)) {
                eventInfo.event.remove()
            }
        }
        else
            alert(`Booking by ${eventInfo.event.title} \nFrom \n${eventInfo.event.startStr} \nto \n${eventInfo.event.endStr} \n${eventInfo.event.extendedProps.description ?? ''}`);
    }
    function renderEventContent(eventInfo, timeText) {
        //console.log(JSON.stringify(eventInfo))
        return (
            <>
                {eventInfo.timeText} {eventInfo.event.title}
            </>
        )
    }

    function detectConflicts(stillEvent, movingEvent) {
        //console.log('overlap intercept');

        if ((stillEvent.extendedProps.court === movingEvent.extendedProps.court) && !isGuestReservation(stillEvent)) {
            return false;
        }
        return true;
    }

    return (
        <>
            <FullCalendar
                timeZone='UTC'
                themeSystem='bootstrap5'
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                //events={events}
                events={{
                    id: 'backendServerEventSourceId',
                    url: 'api/Bookings',
                    extraParams: {
                        court: court
                    },
                }}
                headerToolbar={{
                    left: 'prev,next',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                editable={user !== null}
                selectable={user !== null}
                select={handleDateSelect}
                selectMirror={true}
                //selectAllow={handleAllowSelect}
                dayMaxEvents={true}
                longPressDelay={500} //milliseconds
                //dateClick={handleDateClick}
                //eventContent={renderEventContent} // custom render function
                eventClick={handleEventClick}
                eventAllow={handleEventAllow}
                eventOverlap={false}// {detectConflicts}
                //eventsSet={handleEvents} // called after events are initialized/added/changed/removed
                // you can update a remote database when these fire:
                eventAdd={v => updateData(v, '+')}
                eventChange={v => updateData(v, '=')}
                eventRemove={v => updateData(v, '-')}
                contentHeight={500}
                firstDay="1"
                slotMinTime="05:00:00"
                slotMaxTime="19:00:00"
                views={
                    {
                        week: {
                            dayHeaderFormat: { weekday: 'short' }
                    }}
                }
                
            //selectOverlap={detectConflicts}
            />
        </>
    )
}