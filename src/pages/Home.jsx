// src/pages/Home.jsx
import React from 'react';
import { Container, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import logo from '../assets/Logo.png';

export default function Home() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    return (
        <Container
            fluid
            className="position-relative d-flex flex-column align-items-center justify-content-center vh-100"
        >
            {/* Top-right language picker */}
            <div className="position-absolute top-0 end-0 m-3">
                <LanguageSwitcher />
            </div>

            {/* Centered logo */}
            <img
                src={logo}
                alt={t('home.logoAlt', 'OpenAgri Logo')}
                className="img-fluid mb-4"
                style={{ maxWidth: 500, width: '100%' }}
            />

            {/* Translated buttons */}
            <div className="d-flex flex-column align-items-center">
                <Button
                    variant="primary"
                    className="mb-4"
                    onClick={() => navigate('/login')}
                >
                    {t('home.login')}
                </Button>
                <Button
                    variant="secondary"
                    onClick={() => navigate('/register')}
                >
                    {t('home.register')}
                </Button>
            </div>
        </Container>
    );
}
