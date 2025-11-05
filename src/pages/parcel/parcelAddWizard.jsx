// file: src/pages/parcel/ParcelAddWizard.jsx
import React from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Alert, Button, Card, Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import FarmMap from "../../components/FarmMap.jsx";
import NumberStep from "../../components/wizard/StepNumber.jsx";
import useDb from "../../contexts/useDb.js";

// assumes you have this; if not, see stub below
import { addParcel } from "../../api/parcels.js";

/* ----------------------------- Wizard store/nav ----------------------------- */

const WizardCtx = React.createContext(null);
const STORE_KEY = "parcelAddWizard.v1";

function loadStore() {
    try {
        const raw = sessionStorage.getItem(STORE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}
function saveStore(data) {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(data || {})); } catch {}
}

function WizardProvider({ children }) {
    const [data, setData] = React.useState(() => loadStore());
    React.useEffect(() => saveStore(data), [data]);
    const value = React.useMemo(() => ({ data, setData }), [data]);
    return <WizardCtx.Provider value={value}>{children}</WizardCtx.Provider>;
}

function useParcelWizardNav() {
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
    const { data, goNext, goBack } = useParcelWizardNav();
    const [loc, setLoc] = React.useState(data.location ?? null); // {lng, lat} | null

    return (
        <div>
            <div className="position-sticky top-0" style={{ zIndex: 1020 }}>
                <Alert variant="secondary" className="rounded-0 text-center py-3 mb-0">
                    <div className="fw-bold fs-4">{t("parcel.add") || "Add a new parcel"}</div>
                    <div className="fs-6">{t("parcel.location") || "Pick location"}</div>
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
                    onClick={() => goNext("/parcels/add/size", { location: loc })}
                    disabled={!loc}
                >
                    {t("button.next") || "Next"}
                </Button>
            </div>
        </div>
    );
}

function StepSize() {
    const { t } = useTranslation();
    const { data, goNext, goBack, ensure } = useParcelWizardNav();
    React.useEffect(() => { ensure(["location"], "/parcels/add/location"); }, []); // eslint-disable-line

    const [size, setSize] = React.useState(data.sizeHa ?? "");
    return (
        <NumberStep
            title={t("parcel.add") || "Add a new parcel"}
            label={t("parcel.size") || "Size (ha)"}
            value={size}
            setValue={setSize}
            placeholder={t("parcel.size.placeholder") || "e.g., 2.5"}
            // allow decimals with dot or comma
            pattern="^[0-9]+([.,][0-9]+)?$"
            inputMode="decimal"
            // convert comma to dot
            normalize={(v) => (v ?? "").toString().trim().replace(",", ".")}
            validate={(v) => (+v > 0 ? "" : (t("form.mustBePositive") || "Must be > 0"))}
            onBack={() => goBack("/parcels/add/location")}
            onNext={(v) => goNext("/parcels/add/confirm", { sizeHa: parseFloat(v) })}
        />
    );
}

function StepConfirm() {
    const { t } = useTranslation();
    const { data, goBack, ensure } = useParcelWizardNav();
    const navigate = useNavigate();

    React.useEffect(() => { ensure(["location", "sizeHa"], "/parcels/add/location"); }, []); // eslint-disable-line

    const { location, sizeHa } = data || {};
    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState("");

    const {farms, user} = useDb();


    const onSubmit = async () => {
        setError("");
        try {

            setBusy(true);

            // Filter farm that belongs to the user
            const userFarms = farms.filter(farm => farm.administrator === user.email);
            if (userFarms.length === 0) {
                throw new Error("No farm found for the current user.");
            }

            // For simplicity, associate the parcel with the first farm found
            const farm = userFarms[0];


            await addParcel({
                center: location,       // { lng, lat }
                sizeHa: sizeHa,
                farm:farm// number
            });
            navigate("/parcels");
        } catch (e) {
            setError(e?.response?.data || e?.message || "Failed to add parcel");
            setBusy(false);
        }
    };

    return (
        <div>
            <div className="position-sticky top-0" style={{ zIndex: 1020 }}>
                <Alert variant="secondary" className="rounded-0 text-center py-3 mb-0">
                    <div className="fw-bold fs-4">{t("parcel.add") || "Add a new parcel"}</div>
                    <div className="fs-6">{t("parcel.confirm") || "Summary"}</div>
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
                            <strong>{t("parcel.location") || "Location"}:</strong>{" "}
                            {location ? `${location.lat}, ${location.lng}` : "—"}
                        </div>
                        <div className="mb-2">
                            <strong>{t("parcel.size") || "Size (ha)"}:</strong>{" "}
                            {sizeHa ?? "—"}
                        </div>
                    </Card.Body>
                </Card>

                <div className="d-flex gap-2">
                    <Button
                        variant="secondary"
                        className="w-50"
                        onClick={() => goBack("/parcels/add/size")}
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

export default function ParcelAddWizard() {
    return (
        <WizardProvider>
            <Routes>
                <Route index element={<Navigate to="location" replace />} />
                <Route path="location" element={<StepLocation />} />
                <Route path="size" element={<StepSize />} />
                <Route path="confirm" element={<StepConfirm />} />
                <Route path="*" element={<Navigate to="location" replace />} />
            </Routes>
        </WizardProvider>
    );
}
