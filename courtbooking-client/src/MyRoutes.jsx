import React from 'react';
import { useState, useEffect } from 'react';
import {
    Routes,
    Route
} from "react-router-dom";
import Login from './Login.jsx';
import Reservations from './Reservations.jsx';
import Ladder from './Ladder.jsx';
import App from './App.jsx'
import { post } from './Utility.js';

const MyRoutes = () => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const checkLogin = async () => {
            let response = await post('api/auth/check', null, null, "GET");
            if (response.ok) {
                response.json().then(data => {
                    setUser(data);
                });
            }
        };
        checkLogin();
    }, [setUser]);

    return (
        <Routes>
            <Route path="/" element={<App />}>
                <Route index element={<Login className={{ padding: "2rem" }} user={user} setUser={setUser} />}/>
                <Route path="/reservations" element={<Reservations user={user} />} />
                <Route path="/ladder/*" element={<Ladder user={user} />} />
            </Route>
        </Routes >
    );
};
export default MyRoutes;