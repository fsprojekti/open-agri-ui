// file: src/pages/crop/CropAddWizard.jsx
import React from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Alert, Button, Card, Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import useDb from "../../contexts/useDb.js";
import ParcelSearchSelect from "../../components/ParcelSearchSelect.jsx";
import CropSearchSelect from "../../components/CropSearchSelect.jsx";
import { addCrop } from "../../api/crops.js";

/* ----------------------------- Wizard store/nav ----------------------------- */
const WizardCtx = React.createContext(null);
const STORE_KEY = "cropAddWizard.v1";

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

function useCropWizardNav() {
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
function parcelItemsFromDb(parcels = []) {
    return parcels.map((p) => {
        const uuid = String(p?.["@id"] ?? p?.id ?? "").match(/[0-9a-f-]{36}$/i)?.[0] || "";
        const label = p?.identifier || `Parcel ${uuid.slice(0, 8)} — ${p?.area ?? "?"} ha`;
        return { value: uuid, label };
    });
}

/* --------------------------------- Steps --------------------------------- */

function StepSelectParcel() {
    const { t } = useTranslation();
    const { data, goNext, goBack } = useCropWizardNav();
    const { parcels } = useDb();

    const items = React.useMemo(() => parcelItemsFromDb(parcels), [parcels]);
    const [parcelId, setParcelId] = React.useState(data.parcelId ?? (items[0]?.value || ""));

    return (
        <div>
            <div className="position-sticky top-0" style={{ zIndex: 1020 }}>
                <Alert variant="secondary" className="rounded-0 text-center py-3 mb-0">
                    <div className="fw-bold fs-4">{t("crop.add") || "Add crop"}</div>
                    <div className="fs-6">{t("crop.selectParcel") || "Select parcel"}</div>
                </Alert>
            </div>

            <div className="p-3" style={{ maxWidth: 560, margin: "0 auto" }}>
                <ParcelSearchSelect
                    items={items}
                    value={parcelId}
                    onChange={setParcelId}
                    label={t("parcel.select") || "Parcel"}
                    placeholder={t("parcel.searchPlaceholder") || "Search parcels…"}
                />

                <div className="d-flex gap-2 mt-3">
                    <Button
                        variant="secondary"
                        className="w-50"
                        onClick={() => goBack("/parcels")} // concrete place to go back to
                    >
                        {t("button.back") || "Back"}
                    </Button>
                    <Button
                        className="w-50 fw-bold"
                        onClick={() => goNext("/crops/add/crop", { parcelId })}
                        disabled={!parcelId}
                    >
                        {t("button.next") || "Next"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

function StepSelectCrop() {
    const { t } = useTranslation();
    const { data, goNext, goBack, ensure, setData } = useCropWizardNav();

    React.useEffect(() => {
        // If we don’t have parcel yet, force user to parcel step
        ensure(["parcelId"], "/crops/add/parcel");
    }, [ensure]);

    const parcelId = data.parcelId || "";
    const [speciesValue, setSpeciesValue] = React.useState(data.speciesValue ?? "");

    const onNext = () => {
        if (!parcelId || !speciesValue) return;
        setData((d) => ({ ...d, speciesValue }));
        goNext("/crops/add/confirm");
    };

    return (
        <div>
            <div className="position-sticky top-0" style={{ zIndex: 1020 }}>
                <Alert variant="secondary" className="rounded-0 text-center py-3 mb-0">
                    <div className="fw-bold fs-4">{t("crop.add") || "Add crop"}</div>
                    <div className="fs-6">{t("crop.details") || "Crop details"}</div>
                </Alert>
            </div>

            <div className="p-3" style={{ maxWidth: 560, margin: "0 auto" }}>
                <CropSearchSelect
                    value={speciesValue}
                    onChange={setSpeciesValue}
                    label={t("crop.species") || "Crop species"}
                    placeholder={t("crop.searchPlaceholder") || "Search crops…"}
                    emptyText={t("common.noMatches") || "No matches"}
                />

                <div className="d-flex gap-2 mt-3">
                    <Button
                        variant="secondary"
                        className="w-50"
                        onClick={() => goBack("/crops/add/parcel")}
                    >
                        {t("button.back") || "Back"}
                    </Button>
                    <Button
                        className="w-50 fw-bold"
                        onClick={onNext}
                        disabled={!parcelId || !speciesValue}
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
    const { data, goBack, ensure } = useCropWizardNav();
    const navigate = useNavigate();
    const { parcels, cropSpeciesOptions, cropSpecies } = useDb();

    React.useEffect(() => {
        // Need both parcel and species before confirm
        ensure(["parcelId", "speciesValue"], "/crops/add/parcel");
    }, [ensure]);

    const { parcelId, speciesValue } = data || {};
    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState("");

    const parcelLabel =
        (parcels || []).find(
            (p) => (String(p?.["@id"] ?? p?.id ?? "").match(/[0-9a-f-]{36}$/i)?.[0] || "") === parcelId
        )?.identifier || (t("parcel.unknown") || "Unknown parcel");

    const speciesLabel =
        (cropSpeciesOptions || []).find((o) => o.value === speciesValue)?.label || speciesValue || "—";

    const onSubmit = async () => {
        setError("");
        try {
            setBusy(true);
            // Build API payload

            let crop=cropSpecies.find((s) => s.id === speciesValue);



            await addCrop({
                parcelId,
                cropName: speciesLabel, // or derive { name, variety } in your API util
                speciesValue,
                name:  crop?.latin,
                variety: crop?.variety,
            });
            navigate("/dashboard");
        } catch (e) {
            setError(e?.response?.data || e?.message || "Failed to create crop");
            setBusy(false);
        }
    };

    return (
        <div>
            <div className="position-sticky top-0" style={{ zIndex: 1020 }}>
                <Alert variant="secondary" className="rounded-0 text-center py-3 mb-0">
                    <div className="fw-bold fs-4">{t("crop.add") || "Add crop"}</div>
                    <div className="fs-6">{t("crop.confirm") || "Confirm"}</div>
                </Alert>
            </div>

            <div className="p-3" style={{ maxWidth: 560, margin: "0 auto" }}>
                {error && <Alert variant="danger" className="mb-3">{String(error)}</Alert>}

                <Card className="mb-3">
                    <Card.Body>
                        <div className="mb-2">
                            <strong>{t("parcel.label") || "Parcel"}:</strong> {parcelLabel} ({parcelId})
                        </div>
                        <div className="mb-2">
                            <strong>{t("crop.name") || "Crop"}:</strong> {speciesLabel}
                        </div>
                    </Card.Body>
                </Card>

                <div className="d-flex gap-2">
                    <Button
                        variant="secondary"
                        className="w-50"
                        onClick={() => goBack("/crops/add/crop")}
                        disabled={busy}
                    >
                        {t("button.back") || "Back"}
                    </Button>
                    <Button
                        className="w-50 fw-bold"
                        onClick={onSubmit}
                        disabled={busy}
                    >
                        {busy ? (<><Spinner size="sm" className="me-2" /> {t("button.working") || "Working…"}</>) : (t("button.submit") || "Submit")}
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* --------------------------------- Router --------------------------------- */

export default function CropAddWizard() {
    return (
        <WizardProvider>
            <Routes>
                {/* use an explicit child route for the "index" to avoid wildcard loops */}
                <Route path="/" element={<Navigate to="/crops/add/parcel" replace />} />
                <Route path="parcel" element={<StepSelectParcel />} />
                <Route path="crop" element={<StepSelectCrop />} />
                <Route path="confirm" element={<StepConfirm />} />
                {/* removed catch-all to avoid redirect churn */}
            </Routes>
        </WizardProvider>
    );
}
