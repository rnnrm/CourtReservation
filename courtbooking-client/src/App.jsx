import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Alert from 'react-bootstrap/Alert';
import { Link } from 'react-router-dom';
import { Outlet } from "react-router";

function App({ offline }) {
    let clubName = import.meta.env.VITE_CLUB_NAME || "Tennis Club";

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
                    <Navbar.Brand as={Link} to="/">{clubName} {offline ? " OFFLINE" : ""}</Navbar.Brand>
                    <Navbar.Toggle aria-controls={`offcanvasNavbar-expand-md`} />
                    <Navbar.Collapse
                        id={`offcanvasNavbar-expand-md`}
                        aria-labelledby={`offcanvasNavbarLabel-expand-md`}
                        placement="end"
                    >
                        <Nav variant="underline" defaultActiveKey="/" className="justify-content-end flex-grow-1 pe-3">
                            <Nav.Link eventKey="/" as={Link} to="/">Account</Nav.Link>
                            <Nav.Link eventKey="/reservations" as={Link} to="/reservations">Book court</Nav.Link>
                            <Nav.Link eventKey="/ladder" as={Link} to="/ladder">Ladder</Nav.Link>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            <div>
                <Outlet />
                {(offline) ?
                    <Alert variant="danger" onClose={() => { }} dismissible>
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