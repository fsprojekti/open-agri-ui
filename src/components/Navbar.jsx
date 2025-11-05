import React from 'react';
// Alias the Bootstrap Navbar so we can export our own `Navbar`
import {
    Navbar as BootstrapNavbar,
    Nav,
    Container,
    Button
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { useTranslation } from 'react-i18next';
import logo from '../assets/LogoHead.png';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleLogout = () => {
        Cookies.remove('jwt',      { path: '/' });
        Cookies.remove('username', { path: '/' });
        navigate('/home', { replace: true });
    };

    return (
        <BootstrapNavbar bg="primary" variant="dark" expand="lg" className="p-2">
            <Container fluid className="px-0">
                {/* Brand with logo + app name */}
                <BootstrapNavbar.Brand
                    as={Link}
                    to="/home"
                    className="d-flex align-items-center"
                >
                    {/*<img*/}
                    {/*    src={logo}*/}
                    {/*    alt={t('nav.appName', 'OpenAgri')}*/}
                    {/*    height="30"*/}
                    {/*    className="me-2"*/}
                    {/*/>*/}
                    <span className="fw-bold">{t('nav.appName', 'OpenAgri')}</span>
                </BootstrapNavbar.Brand>

                <div className="ms-auto me-2">
                             <LanguageSwitcher />
                </div>

                <BootstrapNavbar.Toggle aria-controls="main-navbar" />
                <BootstrapNavbar.Collapse id="main-navbar">
                    {/* Left-side links */}
                    <Nav className="me-auto">
                        <Nav.Link as={Link} to="/dashboard">
                            {t('nav.dashboard')}
                        </Nav.Link>
                        <Nav.Link as={Link} to="/user">
                            {t('nav.profile')}
                        </Nav.Link>
                        <Nav.Link
                            as={Button}
                            variant="link"
                            onClick={handleLogout}
                            className="text-decoration-none"
                        >
                            {t('nav.logout')}
                        </Nav.Link>
                    </Nav>


                </BootstrapNavbar.Collapse>

            </Container>
        </BootstrapNavbar>
    );
}
