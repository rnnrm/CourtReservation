import { useState } from 'react';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import Badge from 'react-bootstrap/Badge';
import Stack from 'react-bootstrap/Stack';
import Calendar from "./Calendar.jsx";
let numCourts = Number(import.meta.env.VITE_NUM_COURTS);

const Reservations = ({ user }) => {


    const [key, setKey] = useState(5);

    return (
        <>
            <Tabs
                defaultActiveKey={Number(import.meta.env["VITE_DEFAULT_COURT"]) }
                id="uncontrolled-tab-example"
                className="mb-3 mt-5"
                activeKey={key}
                onSelect={(k) => setKey(k)}
            >
                {[...Array(numCourts)].map((x, i) => {
                    let title = import.meta.env[`VITE_COURT_TITLE${i + 1}`];
                    let description = import.meta.env[`VITE_COURT_DESCRIPTION${i + 1}`];
                    return (
                        <Tab eventKey={i + 1} title={title} key={i + 1}>
                            <h2>{description}</h2>
                            <Calendar user={user} court={i + 1} />
                </Tab>
                    );
                })}
            </Tabs>
            <Stack direction="horizontal" gap={2} className="me-auto my-3">
                <Badge bg="info" className="ms-auto">Member</Badge>
                <Badge bg="danger">Admin</Badge>
                <Badge bg="warning" text="dark" className="me-auto">
                    Guest
                </Badge>
            </Stack>
            <p>Long press a time slot to create/move/resize a reservation</p>
        </>);

};

export default Reservations;