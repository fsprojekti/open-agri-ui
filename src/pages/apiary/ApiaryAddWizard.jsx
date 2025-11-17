// file: src/pages/apiary/ApiaryAddWizard.jsx
import React from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Alert, Button, Card, Spinner, Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import FarmMap from "../../components/FarmMap.jsx";
// NumberStep import removed because the hive count step has been eliminated
import useDb from "../../contexts/useDb.js";

// assumes you have this; if not, create API call accordingly
import { addApiary } from "../../api/apiary.js";

/* ----------------------------- Wizard store/nav ----------------------------- */

const WizardCtx = React.createContext(null);
const STORE_KEY = "apiaryAddWizard.v1";

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
    } catch {}
}

function WizardProvider({ children }) {
    const [data, setData] = React.useState(() => loadStore());
    React.useEffect(() => saveStore(data), [data]);
    const value = React.useMemo(() => ({ data, setData }), [data]);
    return <WizardCtx.Provider value={value}>{children}</WizardCtx.Provider>;
}

function useApiaryWizardNav() {
    const { data, setData } = React.useContext(WizardCtx);
    const nav = useNavigate();
    const { pathname } = useLocation();

    function goNext(path, patch = {}) {
        setData((d) => ({ ...d, ...patch }));
        nav(path);
    }
    function goBack(path) {
        if (path) nav(path);
        else window.history.back();
    }
    function ensure(requiredKeys = [], redirectPath) {
        const ok = requiredKeys.every((k) => !!data?.[k]);
        if (!ok && redirectPath && pathname !== redirectPath) nav(redirectPath, { replace: true });
    }
    return { data, goNext, goBack, ensure, setData };
}

/* --------------------------------- Steps --------------------------------- */

function StepLocation() {
    const { t } = useTranslation();
    const { data, goNext, goBack } = useApiaryWizardNav();
    const [loc, setLoc] = React.useState(data.location ?? null); // {lng, lat} | null

    return (
        <div>
            <div className="position-sticky top-0" style={{ zIndex: 1020 }}>
                <Alert variant="secondary" className="rounded-0 text-center py-3 mb-0">
                    <div className="fw-bold fs-4">{t("apiary.add") || "Add a new apiary"}</div>
                    <div className="fs-6">{t("apiary.location") || "Pick location"}</div>
                </Alert>
            </div>

            <div className="p-2">
                <FarmMap
                    initialPosition={{ lng: 14.5058, lat: 46.0569 }}
                    onLocationPicked={(p) => setLoc(p)}
                />
                <div className="mt-2 small text-muted">
                    {loc
                        ? `${t("map.selected") || "Selected"}: ${loc.lat}, ${loc.lng}`
                        : t("map.clickToSelect") || "Click on the map to select a location."}
                </div>
            </div>

            <div className="p-2 d-flex gap-2">
                <Button variant="secondary" className="w-50" onClick={() => goBack()}>
                    {t("button.back") || "Back"}
                </Button>
                <Button
                    className="w-50 fw-bold"
                    onClick={() => goNext("/apiary/add/details", { location: loc })}
                    disabled={!loc}
                >
                    {t("button.next") || "Next"}
                </Button>
            </div>
        </div>
    );
}

function StepDetails() {
    const { t } = useTranslation();
    const { data, goNext, goBack, ensure } = useApiaryWizardNav();
    React.useEffect(() => { ensure(["location"], "/apiary/add/location"); }, []); // eslint-disable-line

    const [name, setName] = React.useState(data.name ?? "");
    const [desc, setDesc] = React.useState(data.description ?? "");

    // We embed both fields in a single form for convenience.

    return (
        <div>
            <div className="position-sticky top-0" style={{ zIndex: 1020 }}>
                <Alert variant="secondary" className="rounded-0 text-center py-3 mb-0">
                    <div className="fw-bold fs-4">{t("apiary.add") || "Add a new apiary"}</div>
                    <div className="fs-6">{t("apiary.details") || "Details"}</div>
                </Alert>
            </div>

            <div className="p-3" style={{ maxWidth: 560, margin: "0 auto" }}>
                <Form className="mb-3">
                    <Form.Group className="mb-3" controlId="apiaryName">
                        <Form.Label>{t("apiary.name") || "Apiary name"}</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder={t("apiary.name.placeholder") || "e.g., Meadow Hills Apiary"}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </Form.Group>

                    {/* Hive count input removed */}

                    <Form.Group className="mb-3" controlId="apiaryDescription">
                        <Form.Label>{t("apiary.description") || "Description (optional)"}</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            placeholder={t("apiary.description.placeholder") || "Notes about location, access, forage…"}
                            value={desc}
                            onChange={(e) => setDesc(e.target.value)}
                        />
                    </Form.Group>
                </Form>

                <div className="d-flex gap-2">
                    <Button
                        variant="secondary"
                        className="w-50"
                        onClick={() => goBack("/apiary/add/location")}
                    >
                        {t("button.back") || "Back"}
                    </Button>
                    <Button
                        className="w-50 fw-bold"
                        onClick={() =>
                            goNext("/apiary/add/confirm", {
                                name: name.trim(),
                                description: desc.trim(),
                            })
                        }
                        disabled={!name.trim()}
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
    const { data, goBack, ensure } = useApiaryWizardNav();
    const navigate = useNavigate();

    React.useEffect(() => { ensure(["location", "name"], "/apiary/add/location"); }, []); // eslint-disable-line

    const { location, name, description } = data || {};
    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState("");

    const { farms, user } = useDb();

    const onSubmit = async () => {
        setError("");
        try {
            setBusy(true);

            // Associate apiary with the user's farm (same pattern as Parcel)
            const userFarms = farms.filter((farm) => farm.administrator === user.email);
            if (userFarms.length === 0) {
                throw new Error("No farm found for the current user.");
            }
            const farm = userFarms[0];

            await addApiary({
                center: location,     // { lng, lat }
                name,
                description: description || "",
                // hiveCount removed; default will be used by API
                farm,                 // attach farm record or farm ID depending on your API
            });

            navigate("/apiary"); // or "/apiaries" depending on your routing
        } catch (e) {
            setError(e?.response?.data || e?.message || "Failed to add apiary");
            setBusy(false);
        }
    };

    return (
        <div>
            <div className="position-sticky top-0" style={{ zIndex: 1020 }}>
                <Alert variant="secondary" className="rounded-0 text-center py-3 mb-0">
                    <div className="fw-bold fs-4">{t("apiary.add") || "Add a new apiary"}</div>
                    <div className="fs-6">{t("apiary.confirm") || "Summary"}</div>
                </Alert>
            </div>

            <div className="p-3" style={{ maxWidth: 560, margin: "0 auto" }}>
                {error && (
                    <Alert variant="danger" className="mb-3">
                        {typeof error === "string" ? error : JSON.stringify(error)}
                    </Alert>
                )}

                <Card className="mb-3">
                    <Card.Body>
                        <div className="mb-2">
                            <strong>{t("apiary.name") || "Apiary name"}:</strong>{" "}
                            {name || "—"}
                        </div>
                        <div className="mb-2">
                            <strong>{t("apiary.location") || "Location"}:</strong>{" "}
                            {location ? `${location.lat}, ${location.lng}` : "—"}
                        </div>
                        {/* Hive count display removed */}
                        <div className="mb-2">
                            <strong>{t("apiary.description") || "Description"}:</strong>{" "}
                            {description || "—"}
                        </div>
                    </Card.Body>
                </Card>

                <div className="d-flex gap-2">
                    <Button
                        variant="secondary"
                        className="w-50"
                        onClick={() => goBack("/apiary/add/details")}
                        disabled={busy}
                    >
                        {t("button.back") || "Back"}
                    </Button>
                    <Button className="w-50 fw-bold" onClick={onSubmit} disabled={busy}>
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

export default function ApiaryAddWizard() {
    return (
        <WizardProvider>
            <Routes>
                <Route index element={<Navigate to="location" replace />} />
                <Route path="location" element={<StepLocation />} />
                <Route path="details" element={<StepDetails />} />
                <Route path="confirm" element={<StepConfirm />} />
                <Route path="*" element={<Navigate to="location" replace />} />
            </Routes>
        </WizardProvider>
    );
}
