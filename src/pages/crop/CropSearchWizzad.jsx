// file: src/pages/crop/CropSearchWizard.jsx
import React from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Alert, Button } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import CropSearchSelect from "../../components/CropSearch.jsx";

const STORE_KEY = "cropSearchWizard.selection.v1";

/* ------------------------------- Utilities ------------------------------- */
function useQuery() {
    const { search } = useLocation();
    return React.useMemo(() => new URLSearchParams(search), [search]);
}

function saveSelection(sel) {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(sel || {})); } catch {}
}

/* --------------------------------- Step ---------------------------------- */
function StepSelectCrop() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const query = useQuery();
    const returnTo = query.get("returnTo") || "/crops";

    const [speciesValue, setSpeciesValue] = React.useState("");

    const onConfirm = () => {
        if (!speciesValue) return;
        const selection = { speciesValue };
        saveSelection(selection);
        navigate(returnTo, { replace: true, state: selection });
    };

    return (
        <div>
            <div className="position-sticky top-0" style={{ zIndex: 1020 }}>
                <Alert variant="secondary" className="rounded-0 text-center py-3 mb-0">
                    <div className="fw-bold fs-4">
                        {t("crop.searchTitle") || "Select a crop"}
                    </div>
                    <div className="fs-6">
                        {t("crop.searchSubtitle") || "Search and pick one crop species"}
                    </div>
                </Alert>
            </div>

            <div className="p-3" style={{ maxWidth: 560, margin: "0 auto" }}>
                <CropSearchSelect
                    value={speciesValue}
                    onChange={setSpeciesValue}
                    label={t("crop.selectSpecies") || "Crop species"}
                    placeholder={t("crop.searchPlaceholder") || "Search crops…"}
                    emptyText={t("common.noMatches") || "No matches"}
                />

                <div className="d-flex gap-2 mt-3">
                    <Button variant="secondary" className="w-50" onClick={() => navigate(-1)}>
                        {t("button.back") || "Back"}
                    </Button>
                    <Button className="w-50 fw-bold" onClick={onConfirm} disabled={!speciesValue}>
                        {t("button.select") || "Select"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* --------------------------------- Router --------------------------------- */
export default function CropSearchWizard() {
    return (
        <Routes>
            <Route index element={<StepSelectCrop />} />
            <Route path="*" element={<Navigate to="." replace />} />
        </Routes>
    );
}
