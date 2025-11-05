import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { useTranslation } from 'react-i18next';

export default function Beehive() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <>
            <Navbar />

            <Container className="py-4">
                <Row className="g-4">
                    <Col md={6}>
                        <Button
                            variant="primary"
                            className="w-100 py-5 fs-3 fw-bold shadow-lg"
                            onClick={() => navigate('/beehive/search')}
                        >
                            {t('beehive.search', 'Search beehives')}
                        </Button>
                    </Col>

                    <Col md={6}>
                        <Button
                            variant="secondary"
                            className="w-100 py-5 fs-3 fw-bold shadow-lg"
                            onClick={() => navigate('/beehive/add')}
                        >
                            {t('beehive.add', 'Add beehive')}
                        </Button>
                    </Col>
                </Row>
            </Container>
        </>
    );
}
