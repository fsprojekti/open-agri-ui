// file: src/pages/beehive/BeehiveAddWizard.jsx
import React from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Alert, Button, Card, Spinner, Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import useDb from "../../contexts/useDb.js";
import { addBeehive } from "../../api/beehive.js";

/* ----------------------------- Wizard store/nav ----------------------------- */
const WizardCtx = React.createContext(null);
const STORE_KEY = "beehiveAddWizard.v1";

function load() {
    try { return JSON.parse(sessionStorage.getItem(STORE_KEY) || "{}"); }
    catch { return {}; }
}
function save(d) {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(d || {})); }
    catch {}
}

function WizardProvider({ children }) {
    const [data, setData] = React.useState(load);
    React.useEffect(() => save(data), [data]);
    const value = React.useMemo(() => ({ data, setData }), [data]);
    return <WizardCtx.Provider value={value}>{children}</WizardCtx.Provider>;
}

function useBeehiveWizardNav() {
    const { data, setData } = React.useContext(WizardCtx);
    const navigate = useNavigate();
    const { pathname } = useLocation();

    const goNext = React.useCallback((absPath, patch = {}) => {
        setData((d) => ({ ...d, ...patch }));
        navigate(absPath);
    }, [navigate, setData]);

    const goBack = React.useCallback((absPath) => {
        if (absPath) navigate(absPath);
    }, [navigate]);

    const ensure = React.useCallback((required = [], absRedirect) => {
        const ok = required.every((k) => !!data?.[k]);
        if (!ok && absRedirect && pathname !== absRedirect) {
            navigate(absRedirect, { replace: true });
        }
    }, [data, pathname, navigate]);

    return { data, goNext, goBack, ensure, setData };
}

/* ------------------------------ helpers ------------------------------ */
function apiaryItemsFromDb(apiaries = []) {
    return apiaries.map((a) => {
        const uuid = String(a?.["@id"] ?? a?.id ?? "").match(/[0-9a-f-]{36}$/i)?.[0] || "";
        const label =
            a?.hasToponym ||
            a?.identifier ||
            `Apiary ${uuid.slice(0, 8)}`;
        return { value: uuid, label };
    });
}

/* --------------------------------- Steps --------------------------------- */

function StepSelectApiary() {
    const { t } = useTranslation();
    const { data, goNext, goBack } = useBeehiveWizardNav();
    const { apiaries } = useDb(); // expects list of FarmParcels with category 'apiary'

    const items = React.useMemo(() => apiaryItemsFromDb(apiaries), [apiaries]);
    const [apiaryId, setApiaryId] = React.useState(data.apiaryId ?? (items[0]?.value || ""));

    return (
        <div>
            <div className="position-sticky top-0" style={{ zIndex: 1020 }}>
                <Alert variant="secondary" className="rounded-0 text-center py-3 mb-0">
                    <div className="fw-bold fs-4">{t("beehive.add") || "Add beehive"}</div>
                    <div className="fs-6">{t("beehive.selectApiary") || "Select apiary"}</div>
                </Alert>
            </div>

            <div className="p-3" style={{ maxWidth: 560, margin: "0 auto" }}>
                <Form.Group className="mb-3" controlId="apiarySelect">
                    <Form.Label>{t("apiary.select") || "Apiary"}</Form.Label>
                    <Form.Select
                        value={apiaryId}
                        onChange={(e) => setApiaryId(e.target.value)}
                    >
                        {items.map((it) => (
                            <option key={it.value} value={it.value}>
                                {it.label}
                            </option>
                        ))}
                    </Form.Select>
                </Form.Group>

                <div className="d-flex gap-2 mt-3">
                    <Button
                        variant="secondary"
                        className="w-50"
                        onClick={() => goBack("/apiary")} // a concrete place to go back to
                    >
                        {t("button.back") || "Back"}
                    </Button>
                    <Button
                        className="w-50 fw-bold"
                        onClick={() => goNext("/beehives/add/details", { apiaryId })}
                        disabled={!apiaryId}
                    >
                        {t("button.next") || "Next"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

function StepBeehiveDetails() {
    const { t } = useTranslation();
    const { data, goNext, goBack, ensure } = useBeehiveWizardNav();

    React.useEffect(() => {
        ensure(["apiaryId"], "/beehives/add/apiary");
    }, [ensure]);

    // Beehive basics: code/label, model, frames, notes
    const [code, setCode] = React.useState(data.code ?? "");
    const [model, setModel] = React.useState(data.model ?? "Langstroth");
    const [frames, setFrames] = React.useState(
        typeof data.frames === "number" ? String(data.frames) : ""
    );
    const [notes, setNotes] = React.useState(data.notes ?? "");

    const canNext = code.trim().length > 0 && (!frames || Number.isFinite(+frames));

    return (
        <div>
            <div className="position-sticky top-0" style={{ zIndex: 1020 }}>
                <Alert variant="secondary" className="rounded-0 text-center py-3 mb-0">
                    <div className="fw-bold fs-4">{t("beehive.add") || "Add beehive"}</div>
                    <div className="fs-6">{t("beehive.details") || "Beehive details"}</div>
                </Alert>
            </div>

            <div className="p-3" style={{ maxWidth: 560, margin: "0 auto" }}>
                <Form.Group className="mb-3" controlId="beehiveCode">
                    <Form.Label>{t("beehive.code") || "Beehive code"}</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder={t("beehive.code.placeholder") || "e.g., HIVE-01"}
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                    />
                    <Form.Text className="text-muted">
                        {t("beehive.code.help") || "Unique label for this beehive."}
                    </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3" controlId="beehiveModel">
                    <Form.Label>{t("beehive.model") || "Beehive model"}</Form.Label>
                    <Form.Select value={model} onChange={(e) => setModel(e.target.value)}>
                        <option value="Langstroth">Langstroth</option>
                        <option value="Top-bar">Top-bar</option>
                        <option value="Warre">Warré</option>
                        <option value="AZ">AZ (Slovenian)</option>
                        <option value="Other">{t("common.other") || "Other"}</option>
                    </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3" controlId="beehiveFrames">
                    <Form.Label>{t("beehive.frames") || "Number of frames"}</Form.Label>
                    <Form.Control
                        type="number"
                        inputMode="numeric"
                        min={0}
                        step={1}
                        placeholder="e.g., 10"
                        value={frames}
                        onChange={(e) => setFrames(e.target.value)}
                    />
                </Form.Group>

                <Form.Group className="mb-3" controlId="beehiveNotes">
                    <Form.Label>{t("beehive.notes") || "Notes (optional)"}</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={3}
                        placeholder={t("beehive.notes.placeholder") || "Location in apiary, queen year, etc."}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </Form.Group>

                <div className="d-flex gap-2">
                    <Button
                        variant="secondary"
                        className="w-50"
                        onClick={() => goBack("/beehives/add/apiary")}
                    >
                        {t("button.back") || "Back"}
                    </Button>
                    <Button
                        className="w-50 fw-bold"
                        onClick={() =>
                            goNext("/beehives/add/confirm", {
                                code: code.trim(),
                                model: model.trim(),
                                frames: Number.isFinite(+frames) ? parseInt(frames, 10) : undefined,
                                notes: notes.trim(),
                            })
                        }
                        disabled={!canNext}
                    >
                        {t("button.next") || "Next"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

function StepConfirm() {
    const { t } = useTranslation();
    const { data, goBack, ensure } = useBeehiveWizardNav();
    const navigate = useNavigate();
    const { apiaries } = useDb();

    React.useEffect(() => {
        ensure(["apiaryId", "code", "model"], "/beehives/add/apiary");
    }, [ensure]);

    const { apiaryId, code, model, frames, notes } = data || {};
    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState("");

    const apiaryLabel =
        (apiaries || []).find(
            (a) => (String(a?.["@id"] ?? a?.id ?? "").match(/[0-9a-f-]{36}$/i)?.[0] || "") === apiaryId
        )?.hasToponym ||
        (apiaries || []).find(
            (a) => (String(a?.["@id"] ?? a?.id ?? "").match(/[0-9a-f-]{36}$/i)?.[0] || "") === apiaryId
        )?.identifier ||
        (t("apiary.unknown") || "Unknown apiary");

    const onSubmit = async () => {
        setError("");
        try {
            setBusy(true);

            await addBeehive({
                apiaryId,
                code,
                model,
                frames: Number.isFinite(+frames) ? +frames : undefined,
                notes,
            });

            navigate("/beehives"); // adjust to your index route
        } catch (e) {
            setError(e?.response?.data || e?.message || "Failed to create beehive");
            setBusy(false);
        }
    };

    return (
        <div>
            <div className="position-sticky top-0" style={{ zIndex: 1020 }}>
                <Alert variant="secondary" className="rounded-0 text-center py-3 mb-0">
                    <div className="fw-bold fs-4">{t("beehive.add") || "Add beehive"}</div>
                    <div className="fs-6">{t("beehive.confirm") || "Confirm"}</div>
                </Alert>
            </div>

            <div className="p-3" style={{ maxWidth: 560, margin: "0 auto" }}>
                {error && <Alert variant="danger" className="mb-3">{String(error)}</Alert>}

                <Card className="mb-3">
                    <Card.Body>
                        <div className="mb-2">
                            <strong>{t("apiary.label") || "Apiary"}:</strong> {apiaryLabel} ({apiaryId})
                        </div>
                        <div className="mb-2">
                            <strong>{t("beehive.code") || "Beehive code"}:</strong> {code}
                        </div>
                        <div className="mb-2">
                            <strong>{t("beehive.model") || "Beehive model"}:</strong> {model}
                        </div>
                        <div className="mb-2">
                            <strong>{t("beehive.frames") || "Number of frames"}:</strong>{" "}
                            {Number.isFinite(+frames) ? frames : "—"}
                        </div>
                        <div className="mb-2">
                            <strong>{t("beehive.notes") || "Notes"}:</strong> {notes || "—"}
                        </div>
                    </Card.Body>
                </Card>

                <div className="d-flex gap-2">
                    <Button
                        variant="secondary"
                        className="w-50"
                        onClick={() => goBack("/beehives/add/details")}
                        disabled={busy}
                    >
                        {t("button.back") || "Back"}
                    </Button>
                    <Button
                        className="w-50 fw-bold"
                        onClick={onSubmit}
                        disabled={busy}
                    >
                        {busy ? (
                            <>
                                <Spinner size="sm" className="me-2" /> {t("button.working") || "Working…"}
                            </>
                        ) : (
                            t("button.submit") || "Submit"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* --------------------------------- Router --------------------------------- */

export default function BeehiveAddWizard() {
    return (
        <WizardProvider>
            <Routes>
                {/* explicit child route for the index */}
                <Route path="/" element={<Navigate to="/beehives/add/apiary" replace />} />
                <Route path="apiary" element={<StepSelectApiary />} />
                <Route path="details" element={<StepBeehiveDetails />} />
                <Route path="confirm" element={<StepConfirm />} />
            </Routes>
        </WizardProvider>
    );
}
