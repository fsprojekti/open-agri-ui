// src/routes/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';

export default function ProtectedRoute() {
    const token = Cookies.get('jwt');
    const location = useLocation();

    // Not authed? bounce to login, but remember where we tried to go
    if (!token) return <Navigate to="/login" replace state={{ from: location }} />;
    return <Outlet />; // render child routes
}
