// file: src/pages/parcel/ParcelSearchWizard.jsx
import React from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Alert, Button } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import ParcelSearch from "../../components/ParcelSearch.jsx";

const STORE_KEY = "parcelSearchWizard.selection.v1";

/* ------------------------------- Utilities ------------------------------- */
function useQuery() {
    const { search } = useLocation();
    return React.useMemo(() => new URLSearchParams(search), [search]);
}

function saveSelection(sel) {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(sel || {})); } catch {}
}

/* --------------------------------- Step ---------------------------------- */
function StepSelectParcel() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const query = useQuery();
    const returnTo = query.get("returnTo") || "/parcels";

    const [parcelId, setParcelId] = React.useState("");

    const onConfirm = () => {
        if (!parcelId) return;
        const selection = { parcelId };
        saveSelection(selection);
        navigate(returnTo, { replace: true, state: selection });
    };

    return (
        <div>
            <div className="position-sticky top-0" style={{ zIndex: 1020 }}>
                <Alert variant="secondary" className="rounded-0 text-center py-3 mb-0">
                    <div className="fw-bold fs-4">
                        {t("parcel.searchTitle") || "Select a parcel"}
                    </div>
                    <div className="fs-6">
                        {t("parcel.searchSubtitle") || "Search and pick one parcel"}
                    </div>
                </Alert>
            </div>

            <div className="p-3" style={{ maxWidth: 560, margin: "0 auto" }}>
                <ParcelSearch
                    value={parcelId}
                    onChange={setParcelId}
                    label={t("parcel.select") || "Parcel"}
                    placeholder={t("parcel.searchPlaceholder") || "Search parcels…"}
                />

                <div className="d-flex gap-2 mt-3">
                    <Button variant="secondary" className="w-50" onClick={() => navigate(-1)}>
                        {t("button.back") || "Back"}
                    </Button>
                    <Button className="w-50 fw-bold" onClick={onConfirm} disabled={!parcelId}>
                        {t("button.select") || "Select"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* --------------------------------- Router --------------------------------- */
export default function ParcelSearchWizard() {
    return (
        <Routes>
            <Route index element={<StepSelectParcel />} />
            <Route path="*" element={<Navigate to="." replace />} />
        </Routes>
    );
}
