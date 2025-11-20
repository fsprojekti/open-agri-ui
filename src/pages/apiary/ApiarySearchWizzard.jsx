// src/pages/apiary/ApiarySearchWizard.jsx
import React from "react";
import {Navigate, Route, Routes, useLocation, useNavigate} from "react-router-dom";
import {Alert, Button, Card, Col, Container, Form, Row, Spinner, Table} from "react-bootstrap";
import {useTranslation} from "react-i18next";

import useDb from "../../contexts/useDb.js";
import {fetchApiaryActions, fetchApiaryObservations} from "../../api/apiary.js";

/* ----------------------------- Wizard store/nav ----------------------------- */

const WizardCtx = React.createContext(null);
const STORE_KEY = "apiarySearchWizard.v1";

function loadStore() {
    try {
        const raw = sessionStorage.getItem(STORE_KEY);
        return raw ? JSON.parse(raw) : {};
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

function WizardProvider({children}) {
    const [data, setData] = React.useState(() => loadStore());
    React.useEffect(() => {
        saveStore(data);
    }, [data]);

    const value = React.useMemo(() => ({data, setData}), [data]);
    return <WizardCtx.Provider value={value}>{children}</WizardCtx.Provider>;
}

function useApiarySearchNav() {
    const {data, setData} = React.useContext(WizardCtx);
    const nav = useNavigate();
    const {pathname} = useLocation();

    function goNext(path, patch = {}) {
        setData((d) => {
            const next = {...d, ...patch};
            saveStore(next);
            return next;
        });
        nav(path);
    }

    function goBack(path) {
        if (path) nav(path);
        else window.history.back();
    }

    /** ensure some keys exist; if not, redirect inside wizard */
    function ensure(requiredKeys = [], redirectPath) {
        const ok = requiredKeys.every((k) => !!data?.[k]);
        if (!ok && redirectPath && pathname !== redirectPath) {
            nav(redirectPath, {replace: true});
        }
    }

    return {data, goNext, goBack, ensure, setData};
}

/* --------------------------------- Helpers --------------------------------- */

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

/* --------------------------------- Steps --------------------------------- */

/**
 * Stage 1: select category (observations/actions)
 * Route: /apiary/search/category
 */
function StepCategory() {
    const { t } = useTranslation();
    const {data, goNext, goBack} = useApiarySearchNav();
    const mode = data.mode || null; // "observations" | "actions" | null

    const title = t("apiary.searchTitle") || "Search apiary records";
    const subtitle =
        t("apiary.chooseView") || "Step 1 — Choose what you want to view";

    const chooseMode = (newMode) => {
        goNext("/apiary/search/apiary", {
            mode: newMode,
            apiaryId: "",
            viewStyle: data.viewStyle || "table"
        });
    };

    return (
        <div className="d-flex flex-column min-vh-100">
            <StepHeader title={title} subtitle={subtitle}/>

            <Container fluid className="py-3">
                <Row className="justify-content-center">
                    <Col xs={12} md={10} lg={8}>
                        <section className="mb-4">
                            <Row className="g-3">
                                <Col xs={12} md={6}>
                                    <Button
                                        variant=
                                            "primary"
                                        className="w-100 py-4 fs-5 fw-bold shadow-sm"
                                        onClick={() => chooseMode("observations")}
                                    >
                                        {t("apiary.viewObservations") || "View observations"}
                                    </Button>
                                </Col>
                                <Col xs={12} md={6}>
                                    <Button
                                        variant="success"
                                        className="w-100 py-4 fs-5 fw-bold shadow-sm"
                                        onClick={() => chooseMode("actions")}
                                    >
                                        {t("apiary.viewActions") || "View actions"}
                                    </Button>
                                </Col>
                            </Row>
                        </section>


                    </Col>
                </Row>
            </Container>
        </div>
    );
}


function StepApiary() {
    const {t} = useTranslation();
    const {data, goNext, goBack, ensure} = useApiarySearchNav();
    const {apiaries} = useDb();

    // Ensure we have chosen a mode; otherwise go back to category
    React.useEffect(() => {
        ensure(["mode"], "/apiary/search/category");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const title = t("apiary.searchTitle") || "Search apiary records";
    const subtitle =
        t("apiary.select") || "Step 2 — Select apiary for the chosen view";

    const [apiaryId, setApiaryId] = React.useState(data.apiaryId || "");

    const apiaryOptions = React.useMemo(() => {
        if (!apiaries) return [];
        return apiaries.map((a) => {
            const id =
                String(a?.["@id"] || a?.id || "").match(/[0-9a-f-]{36}$/i)?.[0] || "";
            const label =
                a?.name || a?.identifier || a?.code || `Apiary ${id.slice(0, 8)}`;
            return {value: id, label};
        });
    }, [apiaries]);

    const onNext = () => {
        goNext("/apiary/search/results", {
            apiaryId: apiaryId || "",
            // keep existing mode & viewStyle
        });
    };

    return (
        <div className="d-flex flex-column min-vh-100">
            <StepHeader title={title} subtitle={subtitle}/>

            <Container fluid className="py-3">
                <Row className="justify-content-center">
                    <Col xs={12} md={10} lg={8}>
                        <section className="mb-4">

                            <Form.Group controlId="apiarySelect">

                                <Form.Select
                                    value={apiaryId}
                                    onChange={(e) => setApiaryId(e.target.value)}
                                >
                                    <option value="">
                                        {t("apiary.selectPlaceholder") || "-- choose apiary --"}
                                    </option>
                                    {apiaryOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </section>

                        <div className="d-flex gap-2 mt-4">
                            <Button
                                variant="secondary"
                                className="w-50"
                                onClick={() => goBack("/apiary/search/category")}
                            >
                                {t("button.back") || "Back"}
                            </Button>
                            <Button
                                className="w-50 fw-bold"
                                onClick={onNext}
                                disabled={!apiaryId}
                            >
                                {t("button.next") || "Next"}
                            </Button>
                        </div>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}

/**
 * Stage 3: show results
 * Route: /apiary/search/results
 */
function StepResults() {
    const {t} = useTranslation();
    const {data, goBack, ensure, setData} = useApiarySearchNav();
    const {apiaries} = useDb();

    // Ensure mode & apiary chosen; otherwise go back
    React.useEffect(() => {
        ensure(["mode"], "/apiary/search/category");
        ensure(["apiaryId"], "/apiary/search/apiary");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const title = t("apiary.searchTitle") || "Search apiary records";
    const subtitle =
        data.mode === "actions"
            ? t("apiary.viewActions") || "Step 3 — Viewing actions"
            : t("apiary.viewObservations") || "Step 3 — Viewing observations";

    const [records, setRecords] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState("");
    const viewStyle = data.viewStyle || "table";

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
        apiaryOptions.find((o) => o.value === data.apiaryId)?.label || "";

    // Fetch records on mount when mode/apiaryId are available
    React.useEffect(() => {
        async function load() {
            if (!data.mode || !data.apiaryId) return;
            setLoading(true);
            setError("");
            try {
                const res =
                    data.mode === "actions"
                        ? await fetchApiaryActions(data.apiaryId)
                        : await fetchApiaryObservations(data.apiaryId);
                setRecords(res || []);
            } catch (e) {
                setError(e?.message || "Failed to load records");
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [data.mode, data.apiaryId]);

    const toggleViewStyle = () => {
        const nextStyle = viewStyle === "table" ? "cards" : "table";
        setData((prev) => {
            const next = {...prev, viewStyle: nextStyle};
            saveStore(next);
            return next;
        });
    };

    const renderViewSwitch = () => {
        return (
            <div className="d-flex justify-content-center my-2">
                <Form.Check
                    type="switch"
                    id="apiary-view-style-switch"
                    checked={viewStyle === "cards"}
                    onChange={toggleViewStyle}
                    label={
                        viewStyle === "cards"
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
                <Table striped hover size="sm" className="align-middle mb-0">
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

    const clearAll = () => {
        setData(() => {
            const cleared = {
                mode: null,
                apiaryId: "",
                viewStyle: "table"
            };
            saveStore(cleared);
            return cleared;
        });
        setRecords([]);
        setError("");
        goBack("/apiary/search/category");
    };

    return (
        <div className="d-flex flex-column min-vh-100">
            <StepHeader title={title} subtitle={subtitle} />

            <Container fluid className="py-3">
                <Row className="justify-content-center">
                    <Col xs={12} md={10} lg={8}>


                        {renderViewSwitch()}

                        {error && (
                            <Alert variant="danger" className="py-2 mt-2">
                                {error}
                            </Alert>
                        )}

                        {loading && (
                            <div className="d-flex justify-content-center my-3">
                                <Spinner animation="border" size="sm" className="me-2" />
                                <span>{t("button.pleaseWait") || "Please wait…"}</span>
                            </div>
                        )}

                        {!loading && (
                            <div className="mt-3">
                                {viewStyle === "table" ? renderTable() : renderCards()}
                            </div>
                        )}

                        <div className="d-flex gap-2 mt-4">
                            <Button
                                variant="secondary"
                                className="w-50"
                                onClick={() => goBack("/apiary/search/apiary")}
                            >
                                {t("button.back") || "Back"}
                            </Button>
                            <Button
                                variant="outline-secondary"
                                className="w-50"
                                onClick={clearAll}
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

/* --------------------------------- Router --------------------------------- */

export default function ApiarySearchWizardRouter() {
    return (
        <WizardProvider>
            <Routes>
                <Route index element={<Navigate to="category" replace/>}/>
                <Route path="category" element={<StepCategory/>}/>
                <Route path="apiary" element={<StepApiary/>}/>
                <Route path="results" element={<StepResults/>}/>
                <Route path="*" element={<Navigate to="category" replace/>}/>
            </Routes>
        </WizardProvider>
    );
}
