// file: src/pages/beehive/BeehiveSearchWizard.jsx
import React from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Alert, Button } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import BeehiveSearch from "../../components/BeehiveSearch.jsx";

const STORE_KEY = "beehiveSearchWizard.selection.v1";

/* ------------------------------- Utilities ------------------------------- */
function useQuery() {
    const { search } = useLocation();
    return React.useMemo(() => new URLSearchParams(search), [search]);
}
function saveSelection(sel) {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(sel || {})); } catch {}
}

/* --------------------------------- Step ---------------------------------- */
function StepSelectBeehive() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const query = useQuery();

    const returnTo = query.get("returnTo") || "/beehives";
    const apiaryId = query.get("apiaryId") || ""; // optional pre-filter

    const [beehiveId, setBeehiveId] = React.useState("");

    const onConfirm = () => {
        if (!beehiveId) return;
        const selection = { beehiveId, apiaryId: apiaryId || undefined };
        saveSelection(selection);
        navigate(returnTo, { replace: true, state: selection });
    };

    return (
        <div>
            <div className="position-sticky top-0" style={{ zIndex: 1020 }}>
                <Alert variant="secondary" className="rounded-0 text-center py-3 mb-0">
                    <div className="fw-bold fs-4">{t("beehive.searchTitle") || "Select a beehive"}</div>
                    <div className="fs-6">{t("beehive.searchSubtitle") || "Search and pick one beehive"}</div>
                </Alert>
            </div>

            <div className="p-3" style={{ maxWidth: 560, margin: "0 auto" }}>
                <BeehiveSearch
                    value={beehiveId}
                    onChange={setBeehiveId}
                    apiaryId={apiaryId || undefined}
                    label={t("beehive.select") || "Beehive"}
                    placeholder={t("beehive.searchPlaceholder") || "Search beehives…"}
                />

                <div className="d-flex gap-2 mt-3">
                    <Button variant="secondary" className="w-50" onClick={() => navigate(-1)}>
                        {t("button.back") || "Back"}
                    </Button>
                    <Button className="w-50 fw-bold" onClick={onConfirm} disabled={!beehiveId}>
                        {t("button.select") || "Select"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* --------------------------------- Router --------------------------------- */
export default function BeehiveSearchWizard() {
    return (
        <Routes>
            <Route index element={<StepSelectBeehive />} />
            <Route path="*" element={<Navigate to="." replace />} />
        </Routes>
    );
}
