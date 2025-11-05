// src/pages/Dashboard.jsx
import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useTranslation } from 'react-i18next';

export default function Dashboard() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const buttons = [
        { title: t('dashboard.plot'), path: '/parcels', variant: 'primary' },
        { title: t('dashboard.crops'), path: '/crops', variant: 'info' },
        { title: t('dashboard.apiary'), path: '/apiary', variant: 'secondary' },
        { title: t('dashboard.beehive'), path: '/beehive', variant: 'warning' },

    ];

    return (
        <>
            <Navbar />

            <Container fluid className="p-4">
                <Row className="g-4">
                    {buttons.map(({ title, path, variant }, idx) => (
                        <Col key={idx} md={4}>
                            <Button
                                variant={variant}
                                className="w-100 py-5 fs-3 fw-bold shadow-lg"
                                onClick={() => navigate(path)}
                            >
                                {title}
                            </Button>
                        </Col>
                    ))}
                </Row>
            </Container>
        </>
    );
}
