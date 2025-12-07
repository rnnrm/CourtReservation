import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Offcanvas from 'react-bootstrap/Offcanvas';
import Alert from 'react-bootstrap/Alert';
import { Link } from 'react-router-dom';
import { Outlet } from "react-router";
import { useEffect, useState } from 'react';

function App({offline}) {
    let expand = 'md';

    return (
        <>
            {/*<link
                rel="stylesheet"
               href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css"
                integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T"
                crossOrigin="anonymous"
            />*/}

            <Navbar collapseOnSelect fixed="top" expand={'md'} className="bg-body-tertiary mb-3">
                <Container fluid>
                    <Navbar.Brand as={Link} to="/">KenRho Tennis Club {offline ? " OFFLINE" : ""}</Navbar.Brand>
                    <Navbar.Toggle aria-controls={`offcanvasNavbar-expand-${expand}`} />
                    <Navbar.Collapse 
                        
                        id={`offcanvasNavbar-expand-${expand}`}
                        aria-labelledby={`offcanvasNavbarLabel-expand-${expand}`}
                        placement="end"
                    >
                        {/*<Offcanvas.Header closeButton>*/}
                        {/*    */}{/*<Offcanvas.Title id={`offcanvasNavbarLabel-expand-${expand}`}>*/}
                        {/*    */}{/*    Offcanvas*/}
                        {/*    */}{/*</Offcanvas.Title>*/}
                        {/*</Offcanvas.Header>*/}
                        {/*<Offcanvas.Body>*/}
                            <Nav variant="underline" defaultActiveKey="/" className="justify-content-end flex-grow-1 pe-3">
                                <Nav.Link eventKey="/" as={Link} to="/">Account</Nav.Link>
                            <Nav.Link eventKey="/reservations" as={Link} to="/reservations">Book court</Nav.Link>

                            <Nav.Link eventKey="/ladder" as={Link} to="/ladder">Ladder</Nav.Link>
                                {/*<NavDropdown*/}
                                {/*    title="Ladder"*/}
                                {/*    id={`offcanvasNavbarDropdown-expand-${expand}`}*/}
                                {/*>*/}
                                {/*    <NavDropdown.Item eventKey="/ladder" as={Link} to="/ladder/singles">Singles ladder</NavDropdown.Item>*/}
                                {/*    <NavDropdown.Item as={Link} to="/ladder/doubles">*/}
                                {/*        Doubles ladder*/}
                                {/*    </NavDropdown.Item>*/}
                                {/*    <NavDropdown.Divider />*/}
                                {/*    <NavDropdown.Item href="#action5">*/}
                                {/*        Tournament*/}
                                {/*    </NavDropdown.Item>*/}
                                {/*</NavDropdown>*/}
                            </Nav>
                            {/*<Form className="d-flex">*/}
                            {/*    <Form.Control*/}
                            {/*        type="search"*/}
                            {/*        placeholder="Search"*/}
                            {/*        className="me-2"*/}
                            {/*        aria-label="Search"*/}
                            {/*    />*/}
                            {/*    <Button variant="outline-success">Search</Button>*/}
                            {/*</Form>*/}
                        {/*</Offcanvas.Body>*/}
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            <div>
                <Outlet/>
                {(offline) ?
                    <Alert variant="danger" onClose={() => { } } dismissible>
                        {/*<Alert.Heading>Offline</Alert.Heading>*/}
                        <p>
                            {(!navigator.onLine) ?
                                'You are currently offline. Please check your connection and refresh.'
                            :
                                'Server is offline.'
                            }
                        </p>
                    </Alert>
                : ""}

            </div>
        </>
    );

}

export default App;