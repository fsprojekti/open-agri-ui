// src/pages/apiary/ApiarySearchWizard.jsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    Alert,
    Button,
    Card,
    Col,
    Container,
    Form,
    Row,
    Spinner,
    Table
} from "react-bootstrap";
import { useTranslation } from "react-i18next";

import useDb from "../../contexts/useDb.js";
import {
    fetchApiaryObservations,
    fetchApiaryActions
} from "../../api/apiary.js";

/* ----------------------- small utilities / helpers ----------------------- */

const STORE_KEY = "apiarySearchWizard.v1";

function loadStore() {
    try {
        return JSON.parse(sessionStorage.getItem(STORE_KEY) || "{}");
    } catch {
        return {};
    }
}

function saveStore(data) {
    try {
        sessionStorage.setItem(STORE_KEY, JSON.stringify(data || {}));
    } catch {
        // ignore
    }
}

function StepHeader({ title, subtitle }) {
    return (
        <div className="position-sticky top-0" style={{ zIndex: 1020 }}>
            <Alert variant="secondary" className="rounded-0 text-center py-3 mb-0">
                <div className="fw-bold fs-4">{title}</div>
                <div className="fs-6">{subtitle}</div>
            </Alert>
        </div>
    );
}

function formatDateTime(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
}

/* ------------------------------ main wizard ------------------------------ */

export default function ApiarySearchWizard() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { search } = useLocation();
    const returnTo = new URLSearchParams(search).get("returnTo") || "/apiary";

    const { apiaries } = useDb(); // assumes DbContext exposes apiaries list

    const [state, setState] = React.useState(() => ({
        apiaryId: "",
        mode: null, // "actions" | "observations"
        viewStyle: "table", // "table" | "cards"
        ...loadStore()
    }));

    const [records, setRecords] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState("");

    const hasMode = Boolean(state.mode);
    const hasApiary = Boolean(state.apiaryId);

    // derive dropdown options for apiaries
    const apiaryOptions = React.useMemo(() => {
        if (!apiaries) return [];
        return apiaries.map((a) => {
            const id =
                String(a?.["@id"] || a?.id || "").match(/[0-9a-f-]{36}$/i)?.[0] || "";
            const label =
                a?.name || a?.identifier || a?.code || `Apiary ${id.slice(0, 8)}`;
            return { value: id, label };
        });
    }, [apiaries]);

    const selectedApiaryLabel =
        apiaryOptions.find((o) => o.value === state.apiaryId)?.label || "";

    /* ---------------------------- step state logic --------------------------- */

    const handleChooseMode = (mode) => {
        const next = {
            ...state,
            mode,
            apiaryId: "", // reset apiary when changing category
            viewStyle: "table"
        };
        setState(next);
        saveStore(next);
        setRecords([]);
        setError("");
    };

    const handleSelectApiary = async (apiaryId) => {
        const next = { ...state, apiaryId };
        setState(next);
        saveStore(next);
        setError("");
        setRecords([]);

        if (!apiaryId || !next.mode) return;

        setLoading(true);
        try {
            const data =
                next.mode === "actions"
                    ? await fetchApiaryActions(apiaryId)
                    : await fetchApiaryObservations(apiaryId);
            setRecords(data || []);
        } catch (e) {
            setError(e?.message || "Failed to load records");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleViewStyle = () => {
        const viewStyle = state.viewStyle === "table" ? "cards" : "table";
        const next = { ...state, viewStyle };
        setState(next);
        saveStore(next);
    };

    const title = t("apiary.searchTitle") || "Search apiary records";
    const subtitle = !hasMode
        ? t("apiary.chooseView") || "Choose what to view"
        : !hasApiary
            ? t("apiary.select") || "Select apiary"
            : state.mode === "actions"
                ? t("apiary.viewActions") || "Viewing actions"
                : t("apiary.viewObservations") || "Viewing observations";

    /* ----------------------------- render helpers --------------------------- */

    const renderModeButtons = () => (
        <div className="d-flex flex-column flex-sm-row gap-2 my-3">
            <Button
                variant={state.mode === "observations" ? "primary" : "outline-primary"}
                className="w-100 fw-semibold"
                disabled={loading}
                onClick={() => handleChooseMode("observations")}
            >
                {t("apiary.viewObservations") || "View observations"}
            </Button>
            <Button
                variant={state.mode === "actions" ? "primary" : "outline-primary"}
                className="w-100 fw-semibold"
                disabled={loading}
                onClick={() => handleChooseMode("actions")}
            >
                {t("apiary.viewActions") || "View actions"}
            </Button>
        </div>
    );

    const renderViewSwitch = () => {
        if (!hasMode || !hasApiary) return null;
        return (
            <div className="d-flex justify-content-center my-2">
                <Form.Check
                    type="switch"
                    id="apiary-view-style-switch"
                    checked={state.viewStyle === "cards"}
                    onChange={handleToggleViewStyle}
                    label={
                        state.viewStyle === "cards"
                            ? t("records.cardView") || "Card view"
                            : t("records.tableView") || "Table view"
                    }
                />
            </div>
        );
    };

    const renderTable = () => {
        if (!records?.length) {
            return (
                <div className="text-center text-muted py-4">
                    {loading
                        ? null
                        : t("records.noRecords") || "No records found for this apiary."}
                </div>
            );
        }

        return (
            <div className="table-responsive">
                <Table striped hovered size="sm" className="align-middle mb-0">
                    <thead>
                    <tr>
                        <th>{t("records.date") || "Date & time"}</th>
                        <th>{t("records.type") || "Type"}</th>
                        <th>{t("records.value") || "Value"}</th>
                    </tr>
                    </thead>
                    <tbody>
                    {records.map((rec, idx) => {
                        const property =
                            rec.observedProperty ||
                            rec.observed_property ||
                            rec.activityType ||
                            rec.activity_type ||
                            rec.type ||
                            "—";
                        const res = rec.hasResult || rec.has_result || {};
                        const value = res.hasValue ?? res.value ?? "—";
                        const unit = res.unit ?? "";
                        return (
                            <tr key={rec.id || rec["@id"] || idx}>
                                <td>{formatDateTime(rec.phenomenonTime || rec.time)}</td>
                                <td>{String(property)}</td>
                                <td>
                                    {String(value)}
                                    {unit ? ` ${unit}` : ""}
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </Table>
            </div>
        );
    };

    const renderCards = () => {
        if (!records?.length) {
            return (
                <div className="text-center text-muted py-4">
                    {loading
                        ? null
                        : t("records.noRecords") || "No records found for this apiary."}
                </div>
            );
        }

        return (
            <Row xs={1} sm={2} md={2} className="g-3">
                {records.map((rec, idx) => {
                    const property =
                        rec.observedProperty ||
                        rec.observed_property ||
                        rec.activityType ||
                        rec.activity_type ||
                        rec.type ||
                        "—";
                    const res = rec.hasResult || rec.has_result || {};
                    const value = res.hasValue ?? res.value ?? "—";
                    const unit = res.unit ?? "";
                    const time = rec.phenomenonTime || rec.time;

                    return (
                        <Col key={rec.id || rec["@id"] || idx}>
                            <Card className="h-100 shadow-sm">
                                <Card.Body className="d-flex flex-column">
                                    <Card.Title className="mb-1">
                                        {String(property)}
                                    </Card.Title>
                                    <Card.Subtitle className="text-muted mb-2">
                                        {formatDateTime(time)}
                                    </Card.Subtitle>
                                    <Card.Text className="flex-grow-1">
                    <span className="fw-semibold">
                      {t("records.value") || "Value"}:
                    </span>{" "}
                                        {String(value)}
                                        {unit ? ` ${unit}` : ""}
                                    </Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>
                    );
                })}
            </Row>
        );
    };

    /* --------------------------------- render -------------------------------- */

    return (
        <div className="d-flex flex-column min-vh-100">
            <StepHeader title={title} subtitle={subtitle} />

            <Container fluid className="py-3">
                <Row className="justify-content-center">
                    <Col xs={12} md={10} lg={8}>
                        {/* STEP 1: choose category (observations/actions) */}
                        {renderModeButtons()}

                        {/* STEP 2: select apiary – only meaningful after mode is chosen */}
                        <Form.Group className="mb-3" controlId="apiarySelect">
                            <Form.Label>{t("apiary.select") || "Select apiary"}</Form.Label>
                            <Form.Select
                                value={state.apiaryId}
                                onChange={(e) => handleSelectApiary(e.target.value)}
                                disabled={!hasMode || loading}
                            >
                                <option value="">
                                    {!hasMode
                                        ? t("apiary.selectDisabled") ||
                                        "First choose what you want to view"
                                        : t("apiary.selectPlaceholder") || "-- choose apiary --"}
                                </option>
                                {apiaryOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </Form.Select>
                            {!hasMode && (
                                <Form.Text className="text-muted">
                                    {t("apiary.hintChooseModeFirst") ||
                                        "First pick whether you want to see observations or actions."}
                                </Form.Text>
                            )}
                        </Form.Group>

                        {/* Info about selection */}
                        {hasMode && hasApiary && (
                            <div className="small text-muted mb-2">
                                {t("apiary.selected") || "Selected apiary"}:{" "}
                                <span className="fw-semibold">{selectedApiaryLabel}</span>
                            </div>
                        )}

                        {/* Error & loading */}
                        {error && (
                            <Alert variant="danger" className="py-2">
                                {error}
                            </Alert>
                        )}
                        {loading && (
                            <div className="d-flex justify-content-center my-3">
                                <Spinner animation="border" size="sm" className="me-2" />
                                <span>{t("button.pleaseWait") || "Please wait…"}</span>
                            </div>
                        )}

                        {/* View switch + data */}
                        {renderViewSwitch()}
                        {!loading && hasMode && hasApiary && (
                            <div className="mt-3">
                                {state.viewStyle === "table" ? renderTable() : renderCards()}
                            </div>
                        )}

                        {/* Bottom buttons */}
                        <div className="d-flex gap-2 mt-4">
                            <Button
                                variant="secondary"
                                className="w-50"
                                onClick={() => navigate(returnTo)}
                            >
                                {t("button.back") || "Back"}
                            </Button>
                            <Button
                                variant="outline-secondary"
                                className="w-50"
                                onClick={() => {
                                    const cleared = {
                                        apiaryId: "",
                                        mode: null,
                                        viewStyle: "table"
                                    };
                                    setState(cleared);
                                    saveStore(cleared);
                                    setRecords([]);
                                    setError("");
                                }}
                            >
                                {t("records.clear") || "Clear selection"}
                            </Button>
                        </div>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}
