import React from 'react';
import { useState, useEffect } from 'react';
import {
    Routes,
    Route
} from "react-router-dom";
import Login from './Login.jsx';
import Reservations from './Reservations.jsx';
import Ladder from './Ladder.jsx';
import App from './App.jsx';
import ResetPassword from './ResetPassword.jsx';

const MyRoutes = () => {
    const [user, setUser] = useState(null);
    const [offline, setOffline] = useState(false);

    useEffect(() => {
        const checkLogin = async () => {

            try {
                let response = await fetch('/api/auth/check', { signal: AbortSignal.timeout(10000) });
                if (response.ok || response.status === "401")
                    setOffline(false);
                if (response.ok) {
                    response.json().then(data => {
                        setUser(data);
                    });
                }
            } catch (error) {
                if (error.name === "TimeoutError") {
                    setOffline(true);
                }
            }
        }
        checkLogin();
    }, []);

    return (
        <Routes>
            <Route path="/" element={<App offline={offline} />}>
                <Route index element={<Login className={{ padding: "2rem" }} user={user} setUser={setUser} />} />
                <Route path="/reservations" element={<Reservations user={user} />} />
                <Route path="/ladder/:competitionName" element={<Ladder user={user} />} />
                <Route path="/reset/" element={<ResetPassword />} />
            </Route>
        </Routes >
    );
};
export default MyRoutes;