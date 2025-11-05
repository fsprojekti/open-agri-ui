// src/pages/Register.jsx
import React, { useState } from 'react';
import { Form, Button, Container, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { loginAdmin, registerUser } from '../api/auth.js';
import { SERVICES} from '../config.js';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function Register() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        username: '',
        email: '',
        password: '',
        accessCode: ''
    });
    const [error, setError] = useState(null);

    const handleChange = e =>
        setForm(f => ({ ...f, [e.target.id]: e.target.value }));

    const handleSubmit = async e => {
        e.preventDefault();
        setError(null);
        try {
            // 1) Validate access code
            if (form.accessCode !== SERVICES.gatekeeper.accessCode) {
                throw new Error(t('register.invalidAccessCode'));
            }
            // 2) Login as admin & register
            const token = await loginAdmin();
            await registerUser(form, token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data || err.message);
        }
    };

    return (
        <Container
            fluid
            className="mt-5 position-relative"
            style={{ maxWidth: '400px' }}
        >

            <h2 className="mb-4">{t('register.title')}</h2>

            {error && (
                <Alert variant="danger">
                    {typeof error === 'string' ? error : JSON.stringify(error)}
                </Alert>
            )}

            <Form onSubmit={handleSubmit}>
                {[
                    { id: 'username',   labelKey: 'register.username',   type: 'text'     },
                    { id: 'email',      labelKey: 'register.email',      type: 'email'    },
                    { id: 'password',   labelKey: 'register.password',   type: 'password' },
                    { id: 'accessCode', labelKey: 'register.accessCode', type: 'text'     },
                ].map(({ id, labelKey, type }) => (
                    <Form.Group className="mb-3" controlId={id} key={id}>
                        <Form.Label>{t(labelKey)}</Form.Label>
                        <Form.Control
                            type={type}
                            value={form[id]}
                            onChange={handleChange}
                        />
                    </Form.Group>
                ))}

                <Button variant="primary" type="submit" className="w-100">
                    {t('register.submit')}
                </Button>
            </Form>
        </Container>
    );
}
