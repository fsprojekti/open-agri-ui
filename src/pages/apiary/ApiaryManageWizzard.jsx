// file: src/pages/apiary/ApiaryManageWizard.jsx
import React from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Alert, Button, Card, Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import useDb from "../../contexts/useDb.js";
import { addApiaryAction } from "../../api/apiary.js";

/* Session store helpers */
const STORE_KEY = "apiaryManageWizard.v1";
const loadStore = () => {
    try { return JSON.parse(sessionStorage.getItem(STORE_KEY) || "{}"); }
    catch { return {}; }
};
const saveStore = (data) => {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(data || {})); }
    catch {}
};

/* Utility for step headers */
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

/* Step 1: Select an apiary (parcel) */
function StepSelectApiary() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { search } = useLocation();
    const returnTo = new URLSearchParams(search).get("returnTo") || "/apiary";
    const [state, setState] = React.useState(() => ({
        apiaryId: "",
        actionKey: "",
        value: "",
        ...loadStore()
    }));
    const { apiaryOptions } = useDb();

    const next = () => {
        saveStore(state);
        navigate("../action" + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""));
    };

    return (
        <div>
            <StepHeader
                title={t("apiary.manage") || "Manage apiary"}
                subtitle={t("apiary.select") || "Select apiary"}
            />
            <div className="p-3" style={{ maxWidth: 560, margin: "0 auto" }}>
                <Form.Group controlId="selectApiary">
                    <Form.Label>{t("apiary.select") || "Apiary"}</Form.Label>
                    <Form.Select
                        value={state.apiaryId}
                        onChange={(e) => setState({ ...state, apiaryId: e.target.value })}
                    >
                        <option value="" disabled>--</option>
                        {(apiaryOptions || []).map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </Form.Select>
                </Form.Group>
                <div className="d-flex gap-2 mt-3">
                    <Button variant="secondary" className="w-50" onClick={() => navigate(returnTo)}>
                        {t("button.back") || "Back"}
                    </Button>
                    <Button
                        className="w-50 fw-bold"
                        onClick={next}
                        disabled={!state.apiaryId}
                    >
                        {t("button.next") || "Next"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* Step 2: Select an action */
function StepSelectAction() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { search } = useLocation();
    const returnTo = new URLSearchParams(search).get("returnTo") || "/apiary";
    const [state, setState] = React.useState(() => ({
        apiaryId: "",
        actionKey: "",
        value: "",
        ...loadStore()
    }));
    const { apiaryActionTypeOptions } = useDb();

    React.useEffect(() => {
        if (!state.apiaryId) {
            navigate("../apiary" + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""), { replace: true });
        }
    }, [state.apiaryId, navigate, returnTo]);

    const next = () => {
        saveStore(state);
        navigate("../value" + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""));
    };

    return (
        <div>
            <StepHeader
                title={t("apiary.manage") || "Manage apiary"}
                subtitle={t("actions.select") || "Select action"}
            />
            <div className="p-3" style={{ maxWidth: 560, margin: "0 auto" }}>
                <Form.Group controlId="selectAction">
                    <Form.Label>{t("actions.select") || "Action"}</Form.Label>
                    <Form.Select
                        value={state.actionKey}
                        onChange={(e) => setState({ ...state, actionKey: e.target.value })}
                    >
                        <option value="" disabled>--</option>
                        {(apiaryActionTypeOptions || []).map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </Form.Select>
                </Form.Group>
                <div className="d-flex gap-2 mt-3">
                    <Button variant="secondary" className="w-50"
                            onClick={() => navigate("../apiary" + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""))}>
                        {t("button.back") || "Back"}
                    </Button>
                    <Button
                        className="w-50 fw-bold"
                        onClick={next}
                        disabled={!state.actionKey}
                    >
                        {t("button.next") || "Next"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* Step 3: Enter the value */
function StepEnterValue() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { search } = useLocation();
    const returnTo = new URLSearchParams(search).get("returnTo") || "/apiary";
    const [state, setState] = React.useState(() => ({
        apiaryId: "",
        actionKey: "",
        value: "",
        ...loadStore()
    }));
    const { apiaryActionTypeOptions } = useDb();

    React.useEffect(() => {
        if (!state.apiaryId) {
            navigate("../apiary" + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""), { replace: true });
        } else if (!state.actionKey) {
            navigate("../action" + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""), { replace: true });
        }
    }, [state.apiaryId, state.actionKey, navigate, returnTo]);

    const actionObj = apiaryActionTypeOptions.find((opt) => opt.value === state.actionKey) || {};
    const unit = actionObj.unit ?? null;
    const isNumeric = Boolean(unit);

    const next = () => {
        saveStore(state);
        navigate("../confirm" + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""));
    };

    return (
        <div>
            <StepHeader
                title={t("apiary.manage") || "Manage apiary"}
                subtitle={t("actions.enterValue") || "Enter value"}
            />
            <div className="p-3" style={{ maxWidth: 560, margin: "0 auto" }}>
                <Form.Group controlId="enterValue">
                    <Form.Label>
                        {t("actions.enterValue") || "Value"}
                        {unit ? ` (${unit})` : ""}
                    </Form.Label>
                    {isNumeric ? (
                        <Form.Control
                            type="number"
                            inputMode="decimal"
                            value={state.value}
                            onChange={(e) => setState({ ...state, value: e.target.value })}
                        />
                    ) : (
                        <Form.Control
                            type="text"
                            value={state.value}
                            onChange={(e) => setState({ ...state, value: e.target.value })}
                        />
                    )}
                </Form.Group>
                <div className="d-flex gap-2 mt-3">
                    <Button variant="secondary" className="w-50"
                            onClick={() => navigate("../action" + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""))}>
                        {t("button.back") || "Back"}
                    </Button>
                    <Button
                        className="w-50 fw-bold"
                        onClick={next}
                        disabled={!state.value.toString().trim()}
                    >
                        {t("button.next") || "Next"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* Step 4: Confirm */
function StepConfirm() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { search } = useLocation();
    const returnTo = new URLSearchParams(search).get("returnTo") || "/apiary";
    const [state] = React.useState(() => ({
        apiaryId: "",
        actionKey: "",
        value: "",
        ...loadStore()
    }));
    const { apiaryOptions, apiaryActionTypeOptions } = useDb();
    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState("");

    // Guard required fields
    React.useEffect(() => {
        if (!state.apiaryId) {
            navigate("../apiary" + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""), { replace: true });
        } else if (!state.actionKey) {
            navigate("../action" + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""), { replace: true });
        } else if (!state.value.toString().trim()) {
            navigate("../value" + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""), { replace: true });
        }
    }, [state.apiaryId, state.actionKey, state.value, navigate, returnTo]);

    const apiaryLabel = apiaryOptions.find((opt) => opt.value === state.apiaryId)?.label || state.apiaryId;
    const actionObj = apiaryActionTypeOptions.find((opt) => opt.value === state.actionKey) || {};
    const unit = actionObj.unit ?? null;
    const prettyAction = actionObj.label || state.actionKey;

    const onConfirm = async () => {
        setError("");
        try {
            setBusy(true);
            await addApiaryAction({
                apiaryId: state.apiaryId,
                actionType: actionObj,
                value: state.value
            });
            saveStore(state);
            navigate(returnTo, { replace: true, state });
        } catch (e) {
            setError(e?.response?.data || e?.message || "Failed to create apiary action");
            setBusy(false);
        }
    };

    return (
        <div>
            <StepHeader
                title={t("apiary.manage") || "Manage apiary"}
                subtitle={t("confirm") || "Confirm"}
            />
            <div className="p-3" style={{ maxWidth: 560, margin: "0 auto" }}>
                <Card className="mb-3">
                    <Card.Body>
                        <div className="mb-2">
                            <strong>{t("apiary.label") || "Apiary"}:</strong> {apiaryLabel}
                        </div>
                        <div className="mb-2">
                            <strong>{t("actions.type") || "Action"}:</strong> {prettyAction}
                        </div>
                        <div className="mb-2">
                            <strong>{t("actions.value") || "Value"}:</strong> {state.value}{unit ? ` ${unit}` : ""}
                        </div>
                    </Card.Body>
                </Card>
                {error && (
                    <div className="alert alert-danger py-2 mb-3">{String(error)}</div>
                )}
                <div className="d-flex gap-2">
                    <Button variant="secondary" className="w-50"
                            onClick={() => navigate("../value" + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""))}
                            disabled={busy}
                    >
                        {t("button.back") || "Back"}
                    </Button>
                    <Button
                        className="w-50 fw-bold"
                        onClick={onConfirm}
                        disabled={busy}
                    >
                        {busy ? (t("button.pleaseWait") || "Please wait…") : (t("button.confirm") || "Confirm")}
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* Router */
export default function ApiaryManageWizard() {
    return (
        <Routes>
            <Route index element={<Navigate to="apiary" replace />} />
            <Route path="apiary" element={<StepSelectApiary />} />
            <Route path="action" element={<StepSelectAction />} />
            <Route path="value" element={<StepEnterValue />} />
            <Route path="confirm" element={<StepConfirm />} />
            <Route path="*" element={<Navigate to="apiary" replace />} />
        </Routes>
    );
}
