// src/pages/Dashboard.jsx
import React from 'react';
import { Container, Row, Col, Card, Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';

import { useTranslation } from 'react-i18next';
import SearchOrAdd from "../../components/SearchOrAdd.jsx";

export default function Farm() {
    const { t } = useTranslation();

    return (
        <>
            {/* Top navigation bar */}
            <Navbar />

            {/* Full-width, zero-padding layout */}
            <SearchOrAdd
                addTitle={(t("farm.add"))}
                searchTitle={(t("farm.search"))}
                addPath={"/farms/add/first-name"}
                searchPath={"/farms/search"} >
            </SearchOrAdd>
        </>
    );
}
