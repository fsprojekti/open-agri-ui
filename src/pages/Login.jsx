// src/pages/Login.jsx
import React, { useEffect, useState } from 'react';
import { Alert, Button, Container, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Cookies from 'js-cookie';
import { loginUser } from '../api/auth.js';
import Navbar from '../components/Navbar';

export default function Login() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [form, setForm]   = useState({ username: '', password: '' });
    const [error, setError] = useState(null);

    // If already logged in, redirect to dashboard
    useEffect(() => {
        const token = Cookies.get('jwt');
        if (token) navigate('/dashboard', { replace: true });
    }, [navigate]);

    const handleChange = e =>
        setForm(f => ({ ...f, [e.target.id]: e.target.value }));

    const handleSubmit = async e => {
        e.preventDefault();
        setError(null);
        try {
            await loginUser(form);  // stores JWT in cookie
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data || err.message);
        }
    };

    return (
        <>
            <Container className="mt-5" style={{ maxWidth: 400 }}>
                <h2 className="mb-4">{t('login.title')}</h2>

                {error && (
                    <Alert variant="danger">
                        {typeof error === 'string' ? error : JSON.stringify(error)}
                    </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                    <Form.Group controlId="email" className="mb-3">
                        <Form.Label>{t('login.email')}</Form.Label>
                        <Form.Control
                            type="text"
                            value={form.email}
                            onChange={handleChange}
                            placeholder={t('login.emailPlaceholder')}
                        />
                    </Form.Group>

                    <Form.Group controlId="password" className="mb-3">
                        <Form.Label>{t('login.password')}</Form.Label>
                        <Form.Control
                            type="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder={t('login.passwordPlaceholder')}
                        />
                    </Form.Group>

                    <Button variant="primary" type="submit" className="w-100">
                        {t('login.submit')}
                    </Button>
                </Form>
            </Container>
        </>
    );
}
