

import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid' // a plugin!
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from "@fullcalendar/interaction" // needed for dayClick
import { useEffect, useState } from 'react'
export default function Calendar({ user, court }) {

    const handleDateClick = (arg) => {
        alert(JSON.stringify(arg))
    }

    const post = async (url, obj, errorResponses, method = "POST") => {

        let response = await fetch(url, {
            method: method,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            ...(method !== "GET" && { body: JSON.stringify(obj) })
        });

        if (!response.ok) {
            if (errorResponses && response) {
                //response = await response.json();
                console.log('error: ' + errorResponses(response));
            }
        }

        return response;
    }

    const updateData = (data, action) => {

        if (data.event.extendedProps.owner !== user.email &&
            user.role !== "Admin") return; // only allow owner to modify booking

        let booking = {
            Id: data.event.id,
            Title: data.event.title,
            Start: data.event.startStr,
            End: data.event.endStr,
            AllDay: data.event.allDay,
            ClassName: data.event.classNames.join(" "),
            ExtendedProps: { ...data.event.extendedProps },
            BackgroundColor: data.event.backgroundColor
        };
        switch (action) {
            case '+':
                post('api/Bookings', booking, i => JSON.stringify(i), "POST");
                break;
            case '-':
                post('api/Bookings', { Id:booking.Id, Email:booking.ExtendedProps.owner }, i => JSON.stringify(i), "DELETE");
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
            );
        })) { 
            alert("Time slot already taken for court "+court);
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
                extendedProps: { court: court, owner: user.email, description: "" },
                backgroundColor: colour
            })
        }
    }

    function handleAllowSelect(eventInfo) { 
        console.log('handleAllowSelect',eventInfo.event.extendedProps.owner, user.email);
        if (eventInfo.event.extendedProps.owner !== user.email &&
            user.role !== "Admin") return false; // only allow owner to modify booking)
        return true;
    }
    function handleEventAllow(dropInfo, draggedEvent) {
        //console.log('handleEventAllow ', draggedEvent, dropInfo);
        if (draggedEvent.extendedProps.owner !== user.email &&
            user.role !== "Admin") return false; // only allow owner to modify booking)
        return true;
    }
    
    function handleEventClick(eventInfo) {
        /*{ eventInfo.event.title } <b>{eventInfo.timeStr}</b>  eventInfo.event.description*/
        //console.log('eventInfo', JSON.stringify(eventInfo))
        //let cal = eventInfo.view.calendar.getEvents();
        if (!user || (eventInfo.event.extendedProps.owner !== user?.email
            && user?.role!=="Admin")) //return; // only allow owner to modify booking
            alert(`Booking by ${eventInfo.event.title} \nFrom \n${eventInfo.event.start} \nto \n${eventInfo.event.end} \n${eventInfo.event.extendedProps.description??''}`);
        else
            if (confirm(`Are you sure you want to delete the event \n${eventInfo.event.title} From \n${eventInfo.event.start} \nto \n${eventInfo.event.end} \n${eventInfo.event.extendedProps.description??''}`)) {
                eventInfo.event.remove()
            }

    }
    function renderEventContent(eventInfo,timeText) {
        console.log(JSON.stringify(eventInfo))
        return (
            <>
                {eventInfo.timeText} {eventInfo.event.title}
            </>
        )
    }

    function detectConflicts(stillEvent, movingEvent) {
        console.log('overlap intercept');
        if (stillEvent.extendedProps.court === movingEvent.extendedProps.court) {
            return false;
        }
        return true;
    }

    return (
        <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            //events={events}
            events={{
                url: 'api/Bookings',
                extraParams: {
                    court: court
                },
            }}
            headerToolbar={{
                left: 'prev,next today',
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
            //eventOverlap={detectConflicts}
            //eventsSet={handleEvents} // called after events are initialized/added/changed/removed
            // you can update a remote database when these fire:
            eventAdd={v => updateData(v, '+')}
            eventChange={v => updateData(v, '=')}
            eventRemove={v => updateData(v, '-')}
            contentHeight={500}
            //selectOverlap={detectConflicts}
        />
    )
}