// file: src/pages/crop/CropObserveWizard.jsx
import React from "react";
import {Navigate, Route, Routes, useLocation, useNavigate} from "react-router-dom";
import {Alert, Button, Card} from "react-bootstrap";
import {useTranslation} from "react-i18next";

import ParcelSearchSelect from "../../components/ParcelSearchSelect.jsx";
import CropSearchSelect from "../../components/CropSearchSelect.jsx";
import CropObserveTypeSearch from "../../components/CropObserveTypeSearch.jsx";
import useDb from "../../contexts/useDb.js";
import {addCropObservation} from "../../api/crops.js";

/* ------------------------------- Store utils ------------------------------- */
const STORE_KEY = "cropObserveWizard.selection.v3";
const matchUuid = (s) => String(s || "").match(/[0-9a-f-]{36}$/i)?.[0] || "";

const loadStore = () => {
    try {
        return JSON.parse(sessionStorage.getItem(STORE_KEY) || "{}");
    } catch {
        return {};
    }
};
const saveStore = (d) => {
    try {
        sessionStorage.setItem(STORE_KEY, JSON.stringify(d || {}));
    } catch {
    }
};

function useQuery() {
    const {search} = useLocation();
    return React.useMemo(() => new URLSearchParams(search), [search]);
}

/* ------------------------------ Shared header ------------------------------ */
function StepHeader({title, subtitle}) {
    return (
        <div className="position-sticky top-0" style={{zIndex: 1020}}>
            <Alert variant="secondary" className="rounded-0 text-center py-3 mb-0">
                <div className="fw-bold fs-4">{title}</div>
                <div className="fs-6">{subtitle}</div>
            </Alert>
        </div>
    );
}

/* ------------------------------ Step: Parcel ------------------------------ */
function StepSelectParcel() {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const query = useQuery();
    const returnTo = query.get("returnTo") || "/dashboard";

    const [parcelId, setParcelId] = React.useState(() => loadStore().parcelId || "");

    const next = () => {
        const data = {parcelId, cropId: "", observationKey: ""};
        saveStore(data);
        navigate("../crop" + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""));
    };

    return (
        <div>
            <StepHeader title={t("crop.observe") || "Observe crop"} subtitle={t("parcel.select") || "Select parcel"}/>
            <div className="p-3" style={{maxWidth: 560, margin: "0 auto"}}>
                <ParcelSearchSelect
                    value={parcelId}
                    onChange={setParcelId}
                    label={t("parcel.select") || "Parcel"}
                    placeholder={t("parcel.searchPlaceholder") || "Search parcels…"}
                />
                <div className="d-flex gap-2 mt-3">
                    <Button variant="secondary" className="w-50" onClick={() => navigate(-1)}>
                        {t("button.back") || "Back"}
                    </Button>
                    <Button className="w-50 fw-bold" onClick={next} disabled={!parcelId}>
                        {t("button.next") || "Next"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* ------------------------------- Step: Crop ------------------------------- */
function StepSelectCrop() {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const query = useQuery();
    const returnTo = query.get("returnTo") || "/dashboard";

    const {crops, parcels} = useDb();
    const [state, setState] = React.useState(() => ({parcelId: "", cropId: "", ...loadStore()}));

    // guard: if parcel not chosen, go back
    React.useEffect(() => {
        if (!state.parcelId)
            navigate("../parcel" + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""), {replace: true});
    }, [state.parcelId, navigate, returnTo]);

    // Build items for CropSearchSelect filtered by selected parcel
    const items = React.useMemo(() => {
        const pid = matchUuid(state.parcelId);
        const list = Array.isArray(crops) ? crops : [];
        const filtered = pid
            ? list.filter((c) => {
                const linked =
                    c?.hasAgriParcel ??
                    c?.parcel ??
                    c?.inParcel ??
                    c?.agriParcel ??
                    c?.["hasAgriParcel@id"] ??
                    c?.hasAgriParcel?.["@id"] ??
                    "";
                return matchUuid(linked) === pid;
            })
            : list;

        return filtered.map((c) => {
            const uuid = matchUuid(c?.["@id"] ?? c?.id);
            const name =
                c?.name ||
                c?.cropName ||
                c?.label ||
                `Crop ${uuid.slice(0, 8)}`;

            const species =
                c?.speciesLabel ||
                c?.speciesName ||
                c?.species?.latin ||
                c?.species ||
                c?.speciesValue ||
                null;

            // Parcel label addition (nice UX)
            const parcelUuid = matchUuid(
                c?.hasAgriParcel ?? c?.parcel ?? c?.inParcel?.["@id"] ?? c?.inParcel?.id
            );
            let parcelLabel = "";
            if (parcelUuid) {
                const p = (parcels || []).find((pp) => matchUuid(pp?.["@id"] ?? pp?.id) === parcelUuid);
                const pLabel = p?.identifier || `Parcel ${parcelUuid.slice(0, 8)}`;
                parcelLabel = ` — ${pLabel}`;
            }

            const label = species ? `${name} (${species})${parcelLabel}` : `${name}${parcelLabel}`;
            return {value: uuid || name, label, raw: c};
        });
    }, [crops, parcels, state.parcelId]);

    const next = () => {
        saveStore(state);
        navigate("../type" + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""));
    };

    const back = () => navigate("../parcel" + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""));

    return (
        <div>
            <StepHeader title={t("crop.observe") || "Observe crop"} subtitle={t("crop.selectCrop") || "Select crop"}/>
            <div className="p-3" style={{maxWidth: 560, margin: "0 auto"}}>
                {/* Use CropSearchSelect and pass filtered items */}
                <CropSearchSelect
                    items={items}
                    value={state.cropId}
                    onChange={(v) => setState((d) => ({...d, cropId: v}))}
                />
                <div className="d-flex gap-2 mt-3">
                    <Button variant="secondary" className="w-50" onClick={back}>
                        {t("button.back") || "Back"}
                    </Button>
                    <Button className="w-50 fw-bold" onClick={next} disabled={!state.cropId}>
                        {t("button.next") || "Next"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* --------------------------- Step: Observation Type ----------------------- */
function StepSelectType() {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const query = useQuery();
    const returnTo = query.get("returnTo") || "/dashboard";

    const [state, setState] = React.useState(() => ({parcelId: "", cropId: "", observationKey: "", ...loadStore()}));

    React.useEffect(() => {
        if (!state.parcelId)
            navigate("../parcel" + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""), {replace: true});
        else if (!state.cropId)
            navigate("../crop" + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""), {replace: true});
    }, [state.parcelId, state.cropId, navigate, returnTo]);

    const next = () => {
        saveStore(state);
        navigate("../confirm" + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""));
    };

    const back = () => navigate("../crop" + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""));

    return (
        <div>
            <StepHeader title={t("crop.observe") || "Observe crop"}
                        subtitle={t("observation.selectType") || "Select observation type"}/>
            <div className="p-3" style={{maxWidth: 560, margin: "0 auto"}}>
                {/* Integrated CropObserveTypeSearch (context-sourced) */}
                <CropObserveTypeSearch
                    value={state.observationKey}
                    onChange={(v) => setState((d) => ({...d, observationKey: v}))}
                />
                <div className="d-flex gap-2 mt-3">
                    <Button variant="secondary" className="w-50" onClick={back}>
                        {t("button.back") || "Back"}
                    </Button>
                    <Button className="w-50 fw-bold" onClick={next} disabled={!state.observationKey}>
                        {t("button.next") || "Next"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* -------------------------------- Step: Confirm --------------------------- */
function StepConfirm() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const query = useQuery();
    const returnTo = query.get("returnTo") || "/dashboard";

    const {
        parcelOptions,
        crops,
        cropObservationTypes,
        cropObservationTypeOptions,
    } = useDb();

    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState("");

    const [state] = React.useState(() => ({
        parcelId: "",
        cropId: "",
        observationKey: "",
        ...loadStore(),
    }));

    // Guards: ensure all steps completed
    React.useEffect(() => {
        if (!state.parcelId) {
            navigate(
                "../parcel" +
                (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""),
                { replace: true }
            );
        } else if (!state.cropId) {
            navigate(
                "../crop" +
                (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""),
                { replace: true }
            );
        } else if (!state.observationKey) {
            navigate(
                "../type" +
                (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""),
                { replace: true }
            );
        }
    }, [state, navigate, returnTo]);

    /* ---------- Pretty labels ---------- */

    const parcelLabel =
        (parcelOptions || []).find(
            (o) => matchUuid(o.value) === matchUuid(state.parcelId)
        )?.label || state.parcelId;

    const cropLabel = React.useMemo(() => {
        const uuid = matchUuid(state.cropId);
        const c = (crops || []).find(
            (x) => matchUuid(x?.["@id"] ?? x?.id) === uuid
        );
        if (!c) return state.cropId || "—";
        const name =
            c.cropName ||
            c.name ||
            c.speciesName ||
            c.species ||
            `Crop ${uuid.slice(0, 8)}`;
        return c.variety ? `${name} — ${c.variety}` : name;
    }, [crops, state.cropId]);

    // Resolve selected obs type from options / raw types
    const selectedObsType =
        (cropObservationTypeOptions || []).find(
            (o) => o.value === state.observationKey
        ) ||
        (cropObservationTypes || []).find(
            (o) =>
                o.observation === state.observationKey ||
                o.value === state.observationKey
        ) ||
        null;

    const obsLabel = selectedObsType?.label || state.observationKey || "—";

    /* ---------- Confirm handler ---------- */

    const onConfirm = async () => {
        setError("");

        try {
            setBusy(true);

            if (!selectedObsType) {
                throw new Error("Invalid observation type selection.");
            }

            let observationType= cropObservationTypes.filter(
                (o) => o.value === state.observationKey
            )[0];

            const selection = {
                parcelId: state.parcelId,
                cropId: state.cropId,
                observationType: observationType, // includes farmCalendarActivityId if you mapped it
            };

            await addCropObservation(selection);

            saveStore(selection);
            navigate(returnTo, { replace: true, state: selection });
        } catch (e) {
            setError(
                e?.response?.data ||
                e?.message ||
                "Failed to add crop observation"
            );
            setBusy(false);
        }
    };

    const back = () =>
        navigate(
            "../type" +
            (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : "")
        );

    return (
        <div>
            <StepHeader
                title={t("crop.observe") || "Observe crop"}
                subtitle={t("crop.confirm") || "Confirm"}
            />
            <div
                className="p-3"
                style={{ maxWidth: 560, margin: "0 auto" }}
            >
                <Card className="mb-3">
                    <Card.Body>
                        <div className="mb-2">
                            <strong>{t("parcel.label") || "Parcel"}:</strong>{" "}
                            {parcelLabel || "—"}
                        </div>
                        <div className="mb-2">
                            <strong>{t("crop.label") || "Crop"}:</strong>{" "}
                            {cropLabel || "—"}
                        </div>
                        <div className="mb-1">
                            <strong>
                                {t("observation.type") ||
                                    "Observation type"}
                                :
                            </strong>{" "}
                            {obsLabel}
                        </div>
                    </Card.Body>
                </Card>

                {error && (
                    <div className="alert alert-danger py-2 mb-3">
                        {error}
                    </div>
                )}

                <div className="d-flex gap-2">
                    <Button
                        variant="secondary"
                        className="w-50"
                        onClick={back}
                        disabled={busy}
                    >
                        {t("button.back") || "Back"}
                    </Button>
                    <Button
                        className="w-50 fw-bold"
                        onClick={onConfirm}
                        disabled={busy}
                    >
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
export default function CropObserveWizard() {
    return (
        <Routes>
            <Route index element={<Navigate to="parcel" replace/>}/>
            <Route path="parcel" element={<StepSelectParcel/>}/>
            <Route path="crop" element={<StepSelectCrop/>}/>
            <Route path="type" element={<StepSelectType/>}/>
            <Route path="confirm" element={<StepConfirm/>}/>
            <Route path="*" element={<Navigate to="parcel" replace/>}/>
        </Routes>
    );
}
