import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { useTranslation } from 'react-i18next';

export default function Crop() {
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
                            onClick={() => navigate('/crops/search')}
                        >
                            {t('crop.search', 'Search crops')}
                        </Button>
                    </Col>

                    <Col md={6}>
                        <Button
                            variant="secondary"
                            className="w-100 py-5 fs-3 fw-bold shadow-lg"
                            onClick={() => navigate('/crops/add')}
                        >
                            {t('crop.add', 'Add crop')}
                        </Button>
                    </Col>

                    <Col md={6}>
                        <Button
                            variant="info"
                            className="w-100 py-5 fs-3 fw-bold shadow-lg"
                            onClick={() => navigate('/crops/observe')}
                        >
                            {t('crop.manage', 'Observe crop')}
                        </Button>
                    </Col>

                    <Col md={6}>
                        <Button
                            variant="warning"
                            className="w-100 py-5 fs-3 fw-bold shadow-lg"
                            onClick={() => navigate('/crops/manage')}
                        >
                            {t('crop.manage', 'Manage crop')}
                        </Button>
                    </Col>
                </Row>
            </Container>
        </>
    );
}
