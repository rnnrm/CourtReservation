import { useState } from 'react';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import Badge from 'react-bootstrap/Badge';
import Stack from 'react-bootstrap/Stack';
import Calendar from "./Calendar.jsx";

const Reservations = ({ user }) => {


    const [key, setKey] = useState(1);

    return (
        <>
            <Tabs
                defaultActiveKey="1"
                id="uncontrolled-tab-example"
                className="mb-3"
                activeKey={key}
                onSelect={(k) => setKey(k)}
            >
                <Tab eventKey={1} title="Court 1">
                    <h2>Lower left court</h2>
                    <Calendar key={1} user={user} court={1} />
                </Tab>
                <Tab eventKey={2} title="Court 2">
                    <h2>Lower right court</h2>
                    <Calendar key={2} user={user} court={2} />
                </Tab>
                <Tab eventKey={3} title="Court 3">
                    <h2>Middle left court</h2>
                    <Calendar key={3} user={user} court={3} />
                </Tab>
                <Tab eventKey={4} title="Court 4">
                    <h2>Middle right court</h2>
                    <Calendar key={4} user={user} court={4} />
                </Tab>
                <Tab eventKey={5} title="Court 5">
                    <h2>Upper left court</h2>
                    <Calendar key={5} user={user} court={5} />
                </Tab>
                <Tab eventKey={6} title="Court 6">
                    <h2>Upper right court</h2>
                    <Calendar key={6} user={user} court={6} />
                </Tab>
            </Tabs>
            <Stack direction="horizontal" gap={2} className="me-auto">
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