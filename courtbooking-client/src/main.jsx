import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter as Router } from 'react-router-dom';
import MyRoutes from './MyRoutes.jsx';
import { GoogleOAuthProvider } from "@react-oauth/google";

createRoot(document.getElementById('root')).render(
    <StrictMode>
        {/*<GoogleOAuthProvider clientId="1095576048382-4ftv8vil3rtfcahlcoor6tvoqbc8pacd.apps.googleusercontent.com">*/}
        <Router>
            <MyRoutes />
        </Router>
        {/*</GoogleOAuthProvider>*/}
  </StrictMode>,
)
