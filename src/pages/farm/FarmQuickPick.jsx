// src/routes/farm-search/FarmQuickPick.jsx
import React from "react";
import { Alert, Button, Form, Spinner } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../../components/Navbar.jsx";
import { useDbContext } from "../../hooks/useDbContext.js";

export default function FarmQuickPick() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { farms, farmOptions, loading, error, refreshFarms } = useDbContext();

    const [search, setSearch] = React.useState("");
    const [farmId, setFarmId] = React.useState(state?.farmId || "");

    const filteredOptions = React.useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return farmOptions;
        return farmOptions.filter(o => o.label.toLowerCase().includes(q));
    }, [search, farmOptions]);

    const onNext = () => {
        if (farmId) {
            const f = farms.find(x => String(x.id ?? x.rawId) === String(farmId));
            navigate("/parcels/add/confirm", { state: { ...(state||{}), farmId, farmName: f?.name || "" } });
        } else {
            navigate("/farms/search/filter", { state }); // go to filters
        }
    };

    return (
        <div>
            <Navbar />
            <div className="position-sticky top-0" style={{ zIndex: 1020 }}>
                <Alert variant="secondary" className="rounded-0 text-center py-3 mb-0">
                    <div className="fw-bold fs-4">Find your farm</div>
                    <div className="fs-6">Pick from the list or search. If you can’t find it, continue to filters.</div>
                </Alert>
            </div>

            <div className="p-3" style={{ maxWidth: 520, margin: "0 auto" }}>
                {loading && (
                    <Alert variant="light" className="d-flex align-items-center gap-2">
                        <Spinner animation="border" size="sm" /> Loading farms…
                        <Button variant="link" size="sm" className="ms-2 p-0" onClick={refreshFarms}>Refresh</Button>
                    </Alert>
                )}
                {error && (
                    <Alert variant="danger" className="d-flex justify-content-between align-items-center">
                        <span>{error}</span>
                        <Button variant="outline-light" size="sm" onClick={refreshFarms}>Try again</Button>
                    </Alert>
                )}

                <Form.Group className="mb-3" controlId="farmSearch">
                    <Form.Label className="fw-semibold">Search</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="Type farm name"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </Form.Group>

                <Form.Group className="mb-3" controlId="farmSelect">
                    <Form.Label className="fw-semibold">Farm</Form.Label>
                    <Form.Select
                        size="lg"
                        value={farmId}
                        onChange={(e) => setFarmId(e.target.value)}
                        disabled={loading || !!error || farmOptions.length === 0}
                    >
                        <option value="">— Choose farm —</option>
                        {filteredOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </Form.Select>
                    <div className="form-text">If you can’t find it, press Next to filter.</div>
                </Form.Group>

                <div className="d-flex gap-2">
                    <Button variant="secondary" className="w-50" onClick={() => navigate(-1)}>Back</Button>
                    <Button className="w-50 fw-bold" onClick={onNext}>Next</Button>
                </div>
            </div>
        </div>
    );
}
