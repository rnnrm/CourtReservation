import React from 'react';
import {
    Routes,
    Route
} from "react-router-dom";
import Login from './Login.jsx';
import Reservations from './Reservations.jsx';
import Ladder from './Ladder.jsx';
import App from './App.jsx'
import { useState } from 'react';

const MyRoutes = () => {
    const [user, setUser] = useState(null);

    return (
        <Routes>
            <Route path="/" element={<App />}>
                <Route index element={<Login user={user} setUser={setUser} />}/>
                <Route path="/reservations" element={<Reservations user={user} />} />
                <Route path="/ladder/*" element={<Ladder user={user} />} />
            </Route>
        </Routes >
    );
};
export default MyRoutes;