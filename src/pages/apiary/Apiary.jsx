import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { useTranslation } from 'react-i18next';

export default function Apiary() {
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
                            onClick={() => navigate('/apiary/search')}
                        >
                            {t('apiary.search', 'Search apiaries')}
                        </Button>
                    </Col>

                    <Col md={6}>
                        <Button
                            variant="secondary"
                            className="w-100 py-5 fs-3 fw-bold shadow-lg"
                            onClick={() => navigate('/apiary/add')}
                        >
                            {t('apiary.add', 'Add apiary')}
                        </Button>
                    </Col>

                    <Col md={6}>
                        <Button
                            variant="info"
                            className="w-100 py-5 fs-3 fw-bold shadow-lg"
                            onClick={() => navigate('/apiary/observe')}
                        >
                            {t('apiary.observe', 'Observe apiary')}
                        </Button>
                    </Col>

                    <Col md={6}>
                        <Button
                            variant="warning"
                            className="w-100 py-5 fs-3 fw-bold shadow-lg"
                            onClick={() => navigate('/apiary/manage')}
                        >
                            {t('apiary.manage', 'Manage apiary')}
                        </Button>
                    </Col>

                </Row>
            </Container>
        </>
    );
}
