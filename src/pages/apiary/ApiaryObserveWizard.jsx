// file: src/pages/apiary/ApiaryObserveWizard.jsx
import React from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Alert, Button, Card, Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import useDb from "../../contexts/useDb.js";
import ApiaryObserveTypeSearch from "../../components/ApiaryObserveTypeSearch.jsx";
import apiaryObservations from "../../data/apiaryObserveTypes.json";
import { addApiaryObservation } from "../../api/apiary.js";

/* ----------------------------- Session storage ----------------------------- */
const STORE_KEY = "apiaryObserveWizard.v1";

// Load selections from sessionStorage
const loadStore = () => {
    try {
        return JSON.parse(sessionStorage.getItem(STORE_KEY) || "{}");
    } catch {
        return {};
    }
};

// Save selections to sessionStorage
const saveStore = (data) => {
    try {
        sessionStorage.setItem(STORE_KEY, JSON.stringify(data || {}));
    } catch {}
};

/* ------------------------------ Utility helpers --------------------------- */
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

// Match trailing UUID from IRIs; used to normalise ids
const matchUuid = (s) => String(s || "").match(/[0-9a-f-]{36}/i)?.[0] || "";

/* ------------------------------ Step 1: Apiary ---------------------------- */
function StepSelectApiary() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { search } = useLocation();
    const returnTo = new URLSearchParams(search).get("returnTo") || "/apiary";

    const [apiaryId, setApiaryId] = React.useState(() => loadStore().apiaryId || "");
    const { apiaryOptions } = useDb();

    const next = () => {
        const data = { apiaryId, observationKey: "", observationValue: "" };
        saveStore(data);
        navigate("../type" + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""));
    };

    return (
        <div>
            <StepHeader
                title={t("apiary.observe") || "Observe apiary"}
                subtitle={t("apiary.select") || "Select apiary"}
            />
            <div className="p-3" style={{ maxWidth: 560, margin: "0 auto" }}>
                <Form.Group className="mb-3" controlId="apiarySelect">
                    <Form.Label>{t("apiary.select") || "Apiary"}</Form.Label>
                    <Form.Select value={apiaryId} onChange={(e) => setApiaryId(e.target.value)}>
                        <option value="" disabled>--</option>
                        {(apiaryOptions || []).map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </Form.Select>
                </Form.Group>
                <div className="d-flex gap-2 mt-3">
                    <Button
                        variant="secondary"
                        className="w-50"
                        onClick={() => navigate(returnTo)}
                    >
                        {t("button.back") || "Back"}
                    </Button>
                    <Button
                        className="w-50 fw-bold"
                        onClick={next}
                        disabled={!apiaryId}
                    >
                        {t("button.next") || "Next"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* ------------------------- Step 2: Observation Type ------------------------ */
function StepSelectType() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { search } = useLocation();
    const returnTo = new URLSearchParams(search).get("returnTo") || "/apiary";

    const [state, setState] = React.useState(() => ({ apiaryId: "", observationKey: "", observationValue: "", ...loadStore() }));

    // Ensure the apiary is selected; otherwise redirect
    React.useEffect(() => {
        if (!state.apiaryId) {
            navigate(
                "../apiary" + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""),
                { replace: true }
            );
        }
    }, [state.apiaryId, navigate, returnTo]);

    const next = () => {
        saveStore(state);
        navigate("../value" + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""));
    };

    const back = () => navigate("../apiary" + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""));

    return (
        <div>
            <StepHeader
                title={t("apiary.observe") || "Observe apiary"}
                subtitle={t("observation.selectType") || "Select observation type"}
            />
            <div className="p-3" style={{ maxWidth: 560, margin: "0 auto" }}>
                <ApiaryObserveTypeSearch
                    value={state.observationKey}
                    onChange={(v) => setState((d) => ({ ...d, observationKey: v }))}
                />
                <div className="d-flex gap-2 mt-3">
                    <Button variant="secondary" className="w-50" onClick={back}>
                        {t("button.back") || "Back"}
                    </Button>
                    <Button
                        className="w-50 fw-bold"
                        onClick={next}
                        disabled={!state.observationKey}
                    >
                        {t("button.next") || "Next"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* -------------------------- Step 3: Enter Value --------------------------- */
function StepAddValue() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { search } = useLocation();
    const returnTo = new URLSearchParams(search).get("returnTo") || "/apiary";

    const [state, setState] = React.useState(() => ({
        apiaryId: "",
        observationKey: "",
        observationValue: "",
        ...loadStore(),
    }));

    // Guard to ensure previous steps are complete
    React.useEffect(() => {
        if (!state.apiaryId) {
            navigate("../apiary" + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""), { replace: true });
        } else if (!state.observationKey) {
            navigate("../type" + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""), { replace: true });
        }
    }, [state.apiaryId, state.observationKey, navigate, returnTo]);

    // Determine unit for the selected observation
    const { unit } = React.useMemo(() => {
        const entry = (apiaryObservations || []).find((item) => {
            const key = typeof item === "string" ? item : item?.value;
            return key === state.observationKey;
        }) || {};
        return { unit: entry?.unit ?? null };
    }, [state.observationKey]);

    const isNumeric = !!unit; // treat any non-null unit as requiring numeric input

    const next = () => {
        saveStore(state);
        navigate("../confirm" + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""));
    };

    const back = () =>
        navigate("../type" + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""));

    const label = isNumeric
        ? `${t("observation.enterValue") || "Enter value"}${unit ? ` (${unit})` : ""}`
        : t("observation.enterValue") || "Enter value";

    return (
        <div>
            <StepHeader
                title={t("apiary.observe") || "Observe apiary"}
                subtitle={t("observation.enterValue") || "Enter value"}
            />
            <div className="p-3" style={{ maxWidth: 560, margin: "0 auto" }}>
                <Form.Group className="mb-3" controlId="observationValue">
                    <Form.Label>{label}</Form.Label>
                    {isNumeric ? (
                        <Form.Control
                            type="number"
                            inputMode="decimal"
                            placeholder={unit ? `e.g., 10 ${unit}` : t("common.enterNumber") || "Enter a number"}
                            value={state.observationValue}
                            onChange={(e) => setState((d) => ({ ...d, observationValue: e.target.value }))}
                        />
                    ) : (
                        <Form.Control
                            type="text"
                            placeholder={t("common.enterText") || "Enter text"}
                            value={state.observationValue}
                            onChange={(e) => setState((d) => ({ ...d, observationValue: e.target.value }))}
                        />
                    )}
                </Form.Group>
                <div className="d-flex gap-2">
                    <Button variant="secondary" className="w-50" onClick={back}>
                        {t("button.back") || "Back"}
                    </Button>
                    <Button
                        className="w-50 fw-bold"
                        onClick={next}
                        disabled={!String(state.observationValue || "").trim()}
                    >
                        {t("button.next") || "Next"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* ------------------------------ Step 4: Confirm --------------------------- */
function StepConfirm() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { search } = useLocation();
    const returnTo = new URLSearchParams(search).get("returnTo") || "/apiary";

    const { apiaryOptions } = useDb();
    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState("");
    const [state] = React.useState(() => ({
        apiaryId: "",
        observationKey: "",
        observationValue: "",
        ...loadStore(),
    }));



    // Ensure all selections present
    React.useEffect(() => {
        if (!state.apiaryId) {
            navigate("../apiary" + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""), { replace: true });
        } else if (!state.observationKey) {
            navigate("../type" + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""), { replace: true });
        } else if (!String(state.observationValue || "").trim()) {
            navigate("../value" + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""), { replace: true });
        }
    }, [state.apiaryId, state.observationKey, state.observationValue, navigate, returnTo]);

    // Derive labels for display
    const apiaryLabel = React.useMemo(() => {
        const uid = matchUuid(state.apiaryId);
        const opt = (apiaryOptions || []).find((o) => matchUuid(o.value) === uid);
        return opt?.label || state.apiaryId || "—";
    }, [apiaryOptions, state.apiaryId]);

    const prettyType = React.useMemo(() => {
        const key = state.observationKey;
        const pretty = (k) =>
            String(k || "")
                .toLowerCase()
                .replace(/_/g, " ")
                .replace(/^\w/, (c) => c.toUpperCase());
        return key ? pretty(key) : "—";
    }, [state.observationKey]);

    // Find the unit of the selected observation (for display and API)
    const { unit } = React.useMemo(() => {
        const entry = (apiaryObservations || []).find((item) => {
            const key = typeof item === "string" ? item : item?.value;
            return key === state.observationKey;
        }) || {};
        return { unit: entry?.unit ?? null };
    }, [state.observationKey]);

    const onConfirm = async () => {
        setError("");
        try {
            setBusy(true);
            await addApiaryObservation({
                apiaryId: state.apiaryId,
                observationType: { value: state.observationKey },
                observationValue: state.observationValue,
                unit,
            });
            saveStore(state);
            // Redirect back to the apiary dashboard (or wherever) with success
            navigate(returnTo, { replace: true, state });
        } catch (e) {
            setError(e?.response?.data || e?.message || "Failed to add apiary observation");
            setBusy(false);
        }
    };

    const back = () => navigate("../value" + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""));

    return (
        <div>
            <StepHeader
                title={t("apiary.observe") || "Observe apiary"}
                subtitle={t("apiary.confirm") || t("observation.confirm") || "Confirm"}
            />
            <div className="p-3" style={{ maxWidth: 560, margin: "0 auto" }}>
                <Card className="mb-3">
                    <Card.Body>
                        <div className="mb-2">
                            <strong>{t("apiary.label") || "Apiary"}:</strong> {apiaryLabel}
                        </div>
                        <div className="mb-2">
                            <strong>{t("observation.type") || "Observation type"}:</strong> {prettyType}
                        </div>
                        <div className="mb-2">
                            <strong>{t("observation.value") || "Value"}:</strong>{" "}
                            {state.observationValue}{unit ? ` ${unit}` : ""}
                        </div>
                    </Card.Body>
                </Card>
                {error && (
                    <div className="alert alert-danger py-2 mb-3">
                        {String(error)}
                    </div>
                )}
                <div className="d-flex gap-2">
                    <Button variant="secondary" className="w-50" onClick={back} disabled={busy}>
                        {t("button.back") || "Back"}
                    </Button>
                    <Button className="w-50 fw-bold" onClick={onConfirm} disabled={busy}>
                        {busy
                            ? t("button.pleaseWait") || "Please wait…"
                            : t("button.confirm") || "Confirm"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* --------------------------------- Router --------------------------------- */
export default function ApiaryObserveWizard() {
    return (
        <Routes>
            <Route index element={<Navigate to="apiary" replace />} />
            <Route path="apiary" element={<StepSelectApiary />} />
            <Route path="type" element={<StepSelectType />} />
            <Route path="value" element={<StepAddValue />} />
            <Route path="confirm" element={<StepConfirm />} />
            <Route path="*" element={<Navigate to="apiary" replace />} />
        </Routes>
    );
}
