// src/pages/SearchOrAdd.jsx
import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

export default function SearchOrAdd({ searchTitle, addTitle, searchPath, addPath }) {
    const navigate = useNavigate();

    return (
        <Container className="py-4">
            <Row className="g-4">
                <Col md={6}>
                    <Button
                        variant="primary"
                        className="w-100 py-5 fs-3 fw-bold shadow-lg"
                        onClick={() => navigate(searchPath)}
                    >
                        {searchTitle}
                    </Button>
                </Col>
                <Col md={6}>
                    <Button
                        variant="secondary"
                        className="w-100 py-5 fs-3 fw-bold shadow-lg"
                        onClick={() => navigate(addPath)}
                    >
                        {addTitle}
                    </Button>
                </Col>
            </Row>
        </Container>
    );
}
