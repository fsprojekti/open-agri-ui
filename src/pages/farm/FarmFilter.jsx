// src/routes/farm-search/FarmFilter.jsx
import React from "react";
import { Alert, Button, Form, ListGroup } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../../components/Navbar.jsx";
import { useDbContext } from "../../hooks/useDbContext.js";

export default function FarmFilter() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { farms, loading, error } = useDbContext();

    const [adminUnitL1, setAdminUnitL1] = React.useState("");
    const [municipality, setMunicipality] = React.useState("");
    const [namePart, setNamePart] = React.useState("");

    const results = React.useMemo(() => {
        let arr = farms;
        if (adminUnitL1) {
            arr = arr.filter(f => (f.address.adminUnitL1 || "").toLowerCase() === adminUnitL1.toLowerCase());
        }
        if (municipality) {
            arr = arr.filter(f => (f.address.municipality || "").toLowerCase().includes(municipality.toLowerCase()));
        }
        if (namePart) {
            arr = arr.filter(f => (f.name || "").toLowerCase().includes(namePart.toLowerCase()));
        }
        return arr.slice(0, 50); // keep it short
    }, [farms, adminUnitL1, municipality, namePart]);

    const onPick = (farm) => {
        navigate("/parcels/add/confirm", {
            state: { ...(state||{}), farmId: farm.id ?? farm.rawId, farmName: farm.name || "" },
        });
    };

    return (
        <div>
            <Navbar />
            <div className="position-sticky top-0" style={{ zIndex: 1020 }}>
                <Alert variant="secondary" className="rounded-0 text-center py-3 mb-0">
                    <div className="fw-bold fs-4">Filter farms</div>
                    <div className="fs-6">Narrow down by region, municipality, or name.</div>
                </Alert>
            </div>

            <div className="p-3" style={{ maxWidth: 640, margin: "0 auto" }}>
                {loading && <Alert variant="light">Loading…</Alert>}
                {error && <Alert variant="danger">{error}</Alert>}

                <Form className="mb-3">
                    <Form.Group className="mb-3" controlId="adminUnitL1">
                        <Form.Label className="fw-semibold">Region / Country</Form.Label>
                        <Form.Control
                            placeholder="e.g., Slovenia"
                            value={adminUnitL1}
                            onChange={(e) => setAdminUnitL1(e.target.value)}
                            size="lg"
                        />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="municipality">
                        <Form.Label className="fw-semibold">Municipality</Form.Label>
                        <Form.Control
                            placeholder="e.g., Ljubljana"
                            value={municipality}
                            onChange={(e) => setMunicipality(e.target.value)}
                            size="lg"
                        />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="namePart">
                        <Form.Label className="fw-semibold">Farm name contains</Form.Label>
                        <Form.Control
                            placeholder="e.g., Novak"
                            value={namePart}
                            onChange={(e) => setNamePart(e.target.value)}
                            size="lg"
                        />
                    </Form.Group>
                </Form>

                <ListGroup className="mb-3">
                    {results.map(f => (
                        <ListGroup.Item
                            key={f.id ?? f.rawId}
                            action
                            onClick={() => onPick(f)}
                            className="py-3"
                        >
                            <div className="fw-bold fs-5">{f.name || "Unnamed farm"}</div>
                            <div className="text-muted">
                                {f.address.locatorName ||
                                    [f.address.addressArea, f.address.municipality, f.address.adminUnitL1].filter(Boolean).join(", ")}
                            </div>
                        </ListGroup.Item>
                    ))}
                    {results.length === 0 && <ListGroup.Item className="py-3">No matches.</ListGroup.Item>}
                </ListGroup>

                <div className="d-flex gap-2">
                    <Button variant="secondary" className="w-50" onClick={() => navigate("/farms/search/quick", { state })}>
                        Back
                    </Button>
                    <Button className="w-50 fw-bold" onClick={() => navigate(-1)}>
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
}
