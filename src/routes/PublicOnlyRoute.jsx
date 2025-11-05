// src/routes/PublicOnlyRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Cookies from 'js-cookie';

export default function PublicOnlyRoute() {
    const token = Cookies.get('jwt');
    // If already authed, keep them out of login/register
    if (token) return <Navigate to="/dashboard" replace />;
    return <Outlet />;
}
