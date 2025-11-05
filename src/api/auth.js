// src/api/auth.js
import axios from 'axios';
import {
    SERVICES, SERVICE_NAME
} from '../config.js';

import Cookies from 'js-cookie';

const api = axios.create({
    baseURL: SERVICES.gatekeeper.baseURL,
    headers: { 'Content-Type': 'application/json' }
});

export async function loginAdmin() {
    const { data } = await api.post('/login/', {
        username: SERVICES.gatekeeper.credentials.username,
        password: SERVICES.gatekeeper.credentials.password
    });
    return data.access;  // your JWT
}

export async function loginUser({ email, password }) {
    const { data } = await api.post('/login/', {
        username:email,
        password
    });

    // data.access is your JWT access token
    const token = data.access;

    // 2) store JWT & username in cookies for 7 days
    Cookies.set('jwt', token, {
        path: '/',
        expires: 7,
        secure: true,       // only over HTTPS in production
        sameSite: 'Strict'
    });
    Cookies.set('email', email, { path: '/', expires: 7 });

    // 3) return the raw data if you need it
    return data;
}

export async function registerUser({username, password, email }, token) {
    return api.post(
        '/register/',
        {
            username: email,
            password,
            email,
            service_name: SERVICE_NAME,
        },
        { headers: { Authorization: `Bearer ${token}` } }
    );
}
