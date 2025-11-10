import { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import Login from './Login.jsx';
import Calendar from './Calendar.jsx';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import Badge from 'react-bootstrap/Badge';
import Stack from 'react-bootstrap/Stack';

function App() {
    const [user, setUser] = useState(null);
    const [key, setKey] = useState(1);

    return (
        <>
            {/*<link
                rel="stylesheet"
               href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css"
                integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T"
                crossOrigin="anonymous"
            />*/}
            <div>
                <h1>KenRho Court reservation</h1>

                <Container>
                    <Row>
                        <Col xs lg={12}></Col>

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
                    </Row>
                    <Row>
                        <Login user={user} setUser={setUser} />
                    </Row>
                </Container>
                <p>If you are a member, let a club administrator know your registered email so that they can activate your account.</p>

            </div >
        </>
    );

}

export default App;