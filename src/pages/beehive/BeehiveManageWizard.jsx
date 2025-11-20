// file: src/pages/beehive/BeehiveManageWizard.jsx
import React from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Alert, Button, Card, Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import useDb from "../../contexts/useDb.js";
import { addBeehiveAction } from "../../api/beehive.js";

const STORE_KEY = "beehiveManageWizard.v1";

const loadStore = () => {
    try { return JSON.parse(sessionStorage.getItem(STORE_KEY) || "{}"); }
    catch { return {}; }
};
const saveStore = (data) => {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(data || {})); }
    catch {}
};

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

/* Step 1: select beehive */
function StepSelectBeehive() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { search } = useLocation();
    const returnTo = new URLSearchParams(search).get("returnTo") || "/beehives";

    const [state, setState] = React.useState(() => ({
        beehiveId: "",
        actionKey: "",
        value: "",
        ...loadStore()
    }));

    const { beehives } = useDb();
    // Derive options from the beehives array (similar to apiaryOptions)
    const beehiveOptions = React.useMemo(() => {
        if (!beehives) return [];
        return beehives.map((b) => {
            const id = String(b?.["@id"] || b?.id || "").match(/[0-9a-f-]{36}$/i)?.[0] || "";
            const label = b?.identifier || b?.code || `Beehive ${id.slice(0, 8)}`;
            return { value: id, label };
        });
    }, [beehives]);

    const next = () => {
        saveStore(state);
        navigate("../action" + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""));
    };

    return (
        <div>
            <StepHeader
                title={t("beehive.manage") || "Manage beehive"}
                subtitle={t("beehive.select") || "Select beehive"}
            />
            <div className="p-3" style={{ maxWidth: 560, margin: "0 auto" }}>
                <Form.Group controlId="selectBeehive">
                    <Form.Label>{t("beehive.select") || "Beehive"}</Form.Label>
                    <Form.Select
                        value={state.beehiveId}
                        onChange={(e) => setState((s) => ({ ...s, beehiveId: e.target.value }))}
                    >
                        <option value="" disabled>--</option>
                        {beehiveOptions.map((opt) => (
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
                        disabled={!state.beehiveId}
                    >
                        {t("button.next") || "Next"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* Step 2: select action */
function StepSelectAction() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { search } = useLocation();
    const returnTo = new URLSearchParams(search).get("returnTo") || "/beehives";
    const [state, setState] = React.useState(() => ({
        beehiveId: "",
        actionKey: "",
        value: "",
        ...loadStore()
    }));

    const { beehiveActionTypeOptions } = useDb();

    React.useEffect(() => {
        if (!state.beehiveId) {
            navigate("../beehive" + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""), { replace: true });
        }
    }, [state.beehiveId, navigate, returnTo]);

    const next = () => {
        saveStore(state);
        navigate("../value" + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""));
    };

    return (
        <div>
            <StepHeader
                title={t("beehive.manage") || "Manage beehive"}
                subtitle={t("actions.select") || "Select action"}
            />
            <div className="p-3" style={{ maxWidth: 560, margin: "0 auto" }}>
                <Form.Group controlId="selectAction">
                    <Form.Label>{t("actions.select") || "Action"}</Form.Label>
                    <Form.Select
                        value={state.actionKey}
                        onChange={(e) => setState((s) => ({ ...s, actionKey: e.target.value }))}
                    >
                        <option value="" disabled>--</option>
                        {beehiveActionTypeOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </Form.Select>
                </Form.Group>
                <div className="d-flex gap-2 mt-3">
                    <Button
                        variant="secondary"
                        className="w-50"
                        onClick={() => navigate("../beehive" + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""))}
                    >
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

/* Step 3: enter value */
function StepEnterValue() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { search } = useLocation();
    const returnTo = new URLSearchParams(search).get("returnTo") || "/beehives";
    const [state, setState] = React.useState(() => ({
        beehiveId: "",
        actionKey: "",
        value: "",
        ...loadStore()
    }));
    const { beehiveActionTypeOptions } = useDb();

    React.useEffect(() => {
        if (!state.beehiveId) {
            navigate("../beehive" + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""), { replace: true });
        } else if (!state.actionKey) {
            navigate("../action" + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""), { replace: true });
        }
    }, [state.beehiveId, state.actionKey, navigate, returnTo]);

    const actionObj = beehiveActionTypeOptions.find((opt) => opt.value === state.actionKey) || {};
    const unit = actionObj.unit ?? null;
    const isNumeric = Boolean(unit);

    const next = () => {
        saveStore(state);
        navigate("../confirm" + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""));
    };

    return (
        <div>
            <StepHeader
                title={t("beehive.manage") || "Manage beehive"}
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
                            onChange={(e) => setState((s) => ({ ...s, value: e.target.value }))}
                        />
                    ) : (
                        <Form.Control
                            type="text"
                            value={state.value}
                            onChange={(e) => setState((s) => ({ ...s, value: e.target.value }))}
                        />
                    )}
                </Form.Group>
                <div className="d-flex gap-2 mt-3">
                    <Button
                        variant="secondary"
                        className="w-50"
                        onClick={() => navigate("../action" + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""))}
                    >
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

/* Step 4: confirm */
function StepConfirm() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { search } = useLocation();
    const returnTo = new URLSearchParams(search).get("returnTo") || "/beehives";
    const [state] = React.useState(() => ({
        beehiveId: "",
        actionKey: "",
        value: "",
        ...loadStore()
    }));
    const { beehiveActionTypeOptions } = useDb();
    // Derive human labels for display
    const { beehives } = useDb();
    const beehiveLabel = React.useMemo(() => {
        const opt = (beehives || []).find((b) => {
            const id = String(b?.["@id"] || b?.id || "").match(/[0-9a-f-]{36}$/i)?.[0] || "";
            return id === state.beehiveId;
        });
        return opt?.identifier || opt?.code || state.beehiveId || "—";
    }, [beehives, state.beehiveId]);

    const actionObj = beehiveActionTypeOptions.find((opt) => opt.value === state.actionKey) || {};
    const unit = actionObj.unit ?? null;
    const prettyAction = actionObj.label || state.actionKey;

    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState("");

    React.useEffect(() => {
        if (!state.beehiveId) {
            navigate("../beehive" + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""), { replace: true });
        } else if (!state.actionKey) {
            navigate("../action" + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""), { replace: true });
        } else if (!state.value.toString().trim()) {
            navigate("../value" + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""), { replace: true });
        }
    }, [state.beehiveId, state.actionKey, state.value, navigate, returnTo]);

    const onConfirm = async () => {
        setError("");
        try {
            setBusy(true);
            await addBeehiveAction({
                beehiveId: state.beehiveId,
                actionType: actionObj,
                value: state.value
            });
            saveStore(state);
            navigate(returnTo, { replace: true, state });
        } catch (e) {
            setError(e?.response?.data || e?.message || "Failed to create beehive action");
            setBusy(false);
        }
    };

    return (
        <div>
            <StepHeader
                title={t("beehive.manage") || "Manage beehive"}
                subtitle={t("confirm") || "Confirm"}
            />
            <div className="p-3" style={{ maxWidth: 560, margin: "0 auto" }}>
                <Card className="mb-3">
                    <Card.Body>
                        <div className="mb-2">
                            <strong>{t("beehive.label") || "Beehive"}:</strong> {beehiveLabel}
                        </div>
                        <div className="mb-2">
                            <strong>{t("actions.type") || "Action"}:</strong> {prettyAction}
                        </div>
                        <div className="mb-2">
                            <strong>{t("actions.value") || "Value"}:</strong>{" "}
                            {state.value}{unit ? ` ${unit}` : ""}
                        </div>
                    </Card.Body>
                </Card>
                {error && (
                    <div className="alert alert-danger py-2 mb-3">
                        {String(error)}
                    </div>
                )}
                <div className="d-flex gap-2">
                    <Button
                        variant="secondary"
                        className="w-50"
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

/* Router for wizard */
export default function BeehiveManageWizard() {
    return (
        <Routes>
            <Route index element={<Navigate to="beehive" replace />} />
            <Route path="beehive" element={<StepSelectBeehive />} />
            <Route path="action" element={<StepSelectAction />} />
            <Route path="value" element={<StepEnterValue />} />
            <Route path="confirm" element={<StepConfirm />} />
            <Route path="*" element={<Navigate to="beehive" replace />} />
        </Routes>
    );
}
