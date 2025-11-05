// file: src/pages/apiary/ApiarySearchWizard.jsx
import React from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Alert, Button } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import ApiarySearch from "../../components/ApiarySearch.jsx";

const STORE_KEY = "apiarySearchWizard.selection.v1";

/* ------------------------------- Utilities ------------------------------- */
function useQuery() {
    const { search } = useLocation();
    return React.useMemo(() => new URLSearchParams(search), [search]);
}
function saveSelection(sel) {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(sel || {})); } catch {}
}

/* --------------------------------- Step ---------------------------------- */
function StepSelectApiary() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const query = useQuery();
    const returnTo = query.get("returnTo") || "/apiaries";

    const [apiaryId, setApiaryId] = React.useState("");

    const onConfirm = () => {
        if (!apiaryId) return;
        const selection = { apiaryId };
        saveSelection(selection);
        navigate(returnTo, { replace: true, state: selection });
    };

    return (
        <div>
            <div className="position-sticky top-0" style={{ zIndex: 1020 }}>
                <Alert variant="secondary" className="rounded-0 text-center py-3 mb-0">
                    <div className="fw-bold fs-4">{t("apiary.searchTitle") || "Select an apiary"}</div>
                    <div className="fs-6">{t("apiary.searchSubtitle") || "Search and pick one apiary"}</div>
                </Alert>
            </div>

            <div className="p-3" style={{ maxWidth: 560, margin: "0 auto" }}>
                <ApiarySearch
                    value={apiaryId}
                    onChange={setApiaryId}
                    label={t("apiary.select") || "Apiary"}
                    placeholder={t("apiary.searchPlaceholder") || "Search apiaries…"}
                />

                <div className="d-flex gap-2 mt-3">
                    <Button variant="secondary" className="w-50" onClick={() => navigate(-1)}>
                        {t("button.back") || "Back"}
                    </Button>
                    <Button className="w-50 fw-bold" onClick={onConfirm} disabled={!apiaryId}>
                        {t("button.select") || "Select"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* --------------------------------- Router --------------------------------- */
export default function ApiarySearchWizard() {
    return (
        <Routes>
            <Route index element={<StepSelectApiary />} />
            <Route path="*" element={<Navigate to="." replace />} />
        </Routes>
    );
}
