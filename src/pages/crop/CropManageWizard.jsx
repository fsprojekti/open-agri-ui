// file: src/pages/crop/CropManageWizard.jsx
import React from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Alert, Button, Form, InputGroup } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import CropSearchSelect from "../../components/CropSearchSelect.jsx";
import useDb from "../../contexts/useDb.js";

/* ----------------------------- Wizard store ----------------------------- */
const STORE_KEY = "cropManageWizard.v1";
const WizardCtx = React.createContext(null);

function loadStore() {
    try { return JSON.parse(sessionStorage.getItem(STORE_KEY) || "{}"); }
    catch { return {}; }
}
function saveStore(d) {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(d || {})); } catch {}
}

function WizardProvider({ children }) {
    const [data, setData] = React.useState(loadStore);
    React.useEffect(() => saveStore(data), [data]);
    const value = React.useMemo(() => ({ data, setData }), [data]);
    return <WizardCtx.Provider value={value}>{children}</WizardCtx.Provider>;
}

function useWizardNav() {
    const { data, setData } = React.useContext(WizardCtx);
    const nav = useNavigate();
    const { pathname, search } = useLocation();

    const goNext = (absPath, patch = {}) => {
        setData((d) => ({ ...d, ...patch }));
        nav(absPath + search);
    };
    const goBack = (absPath) => {
        if (absPath) nav(absPath + search);
        else nav(-1);
    };
    const ensure = (requiredKeys = [], redirectAbsPath) => {
        const ok = requiredKeys.every((k) => !!data?.[k]);
        if (!ok && redirectAbsPath && pathname !== redirectAbsPath) {
            nav(redirectAbsPath + search, { replace: true });
        }
    };
    return { data, goNext, goBack, ensure, setData };
}

/* ------------------------------- Utilities ------------------------------- */
function useQuery() {
    const { search } = useLocation();
    return React.useMemo(() => new URLSearchParams(search), [search]);
}

/* --------------------------- Step: Select Crop --------------------------- */

function StepSelectCrop() {
    const { t } = useTranslation();
    const { data, goNext } = useWizardNav();
    const [cropId, setCropId] = React.useState(data.cropId || "");

    return (
        <div>
            <div className="position-sticky top-0" style={{ zIndex: 1020 }}>
                <Alert variant="secondary" className="rounded-0 text-center py-3 mb-0">
                    <div className="fw-bold fs-4">{t("crop.manage") || "Manage crop"}</div>
                    <div className="fs-6">{t("crop.selectCrop") || "Select a crop"}</div>
                </Alert>
            </div>

            <div className="p-3" style={{ maxWidth: 560, margin: "0 auto" }}>
                <CropSearchSelect
                    value={cropId}
                    onChange={setCropId}
                    label={t("crop.selectCropLabel") || "Crop"}
                    placeholder={t("crop.searchPlaceholder") || "Search crops…"}
                />

                <div className="d-flex gap-2 mt-3">
                    <Button variant="secondary" className="w-50" onClick={() => window.history.back()}>
                        {t("button.back") || "Back"}
                    </Button>
                    <Button
                        className="w-50 fw-bold"
                        onClick={() => goNext("/crops/manage/action", { cropId, actionKey: "" })}
                        disabled={!cropId}
                    >
                        {t("button.next") || "Next"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* ------------------------ Step: Select Action ------------------------- */

/** In-wizard searchable radio list that READS actions from DbContext */
function ActionSearchFromDb({
                                value,
                                onChange,
                                label,
                                placeholder,
                                disabled = false,
                            }) {
    const { t } = useTranslation();
    const { cropActionOptions } = useDb(); // <-- actions from context

    // Normalize items (expecting [{value, label}])
    const items = React.useMemo(() => {
        return (Array.isArray(cropActionOptions) ? cropActionOptions : []).map((o) => ({
            value: o?.value ?? String(o ?? ""),
            label: o?.label ?? String(o ?? ""),
        }));
    }, [cropActionOptions]);

    const [query, setQuery] = React.useState("");

    const filtered = React.useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return items;
        return items.filter((it) => (it.label || "").toLowerCase().includes(q));
    }, [items, query]);

    const handlePick = (v) => !disabled && onChange?.(v);
    const handleClear = () => { setQuery(""); onChange?.(""); };

    const ROW_H = 52, VISIBLE_ROWS = 5, maxHeight = ROW_H * VISIBLE_ROWS;

    const _label = label ?? (t("action.selectLabel") || "Action");
    const _placeholder = placeholder ?? (t("action.searchPlaceholder") || "Search actions…");

    return (
        <div>
            {_label && <Form.Label className="fw-semibold">{_label}</Form.Label>}

            <InputGroup className="mb-2">
                <InputGroup.Text aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" role="img" aria-label={t("action.aria.search") || "Search"}>
                        <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.415l-3.85-3.85h-.017zm-5.242.656a5 5 0 1 1 0-10.001 5 5 0 0 1 0 10.001z"/>
                    </svg>
                </InputGroup.Text>
                <Form.Control
                    autoFocus
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={_placeholder}
                    disabled={disabled}
                />
                {(query || value) && (
                    <Button variant="outline-secondary" onClick={handleClear} disabled={disabled}>
                        {t("common.clear") || "Clear"}
                    </Button>
                )}
            </InputGroup>

            <div className="border rounded" style={{ maxHeight, overflowY: "auto", scrollbarGutter: "stable" }}>
                {filtered.length === 0 ? (
                    <div className="p-3 text-muted">{t("common.noMatches") || "No matches"}</div>
                ) : (
                    <div className="list-group list-group-flush">
                        {filtered.map((it, idx) => {
                            const selected = it.value === value;
                            const stripe = !selected && idx % 2 === 1 ? { backgroundColor: "rgba(0,0,0,0.03)" } : undefined;
                            return (
                                <button
                                    key={it.value || it.label}
                                    type="button"
                                    className={`list-group-item list-group-item-action d-flex align-items-center justify-content-between ${selected ? "active" : ""}`}
                                    onClick={() => handlePick(it.value)}
                                    disabled={disabled}
                                    style={{ cursor: disabled ? "not-allowed" : "pointer", ...stripe }}
                                >
                                    <div className={`text-start text-truncate ${selected ? "text-white" : ""}`}>{it.label}</div>
                                    <Form.Check
                                        type="radio"
                                        name="action-select"
                                        checked={selected}
                                        readOnly
                                        aria-label={t("action.aria.selectAction") || "Select this action"}
                                        className={selected ? "text-white" : ""}
                                    />
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="small text-muted mt-2">
                {filtered.length} {(filtered.length === 1 ? (t("common.result") || "result") : (t("common.results") || "results"))}
                {filtered.length > VISIBLE_ROWS ? ` ${t("common.scrollForMore") || "(scroll for more)"}` : ""}
                {query ? ` "${query}"` : ""}.
            </div>
        </div>
    );
}

function StepSelectAction() {
    const { t } = useTranslation();
    const { data, goNext, goBack, ensure, setData } = useWizardNav();

    React.useEffect(() => { ensure(["cropId"], "/crops/manage/crop"); }, []); // eslint-disable-line

    const [actionKey, setActionKey] = React.useState(data.actionKey || "");

    return (
        <div>
            <div className="position-sticky top-0" style={{ zIndex: 1020 }}>
                <Alert variant="secondary" className="rounded-0 text-center py-3 mb-0">
                    <div className="fw-bold fs-4">{t("crop.manage") || "Manage crop"}</div>
                    <div className="fs-6">{t("action.select") || "Select an action"}</div>
                </Alert>
            </div>

            <div className="p-3" style={{ maxWidth: 560, margin: "0 auto" }}>
                <ActionSearchFromDb
                    value={actionKey}
                    onChange={(v) => { setActionKey(v); setData((d) => ({ ...d, actionKey: v })); }}
                    label={t("action.selectLabel") || "Action"}
                    placeholder={t("action.searchPlaceholder") || "Search actions…"}
                />

                <div className="d-flex gap-2 mt-3">
                    <Button variant="secondary" className="w-50" onClick={() => goBack("/crops/manage/crop")}>
                        {t("button.back") || "Back"}
                    </Button>
                    <Button
                        className="w-50 fw-bold"
                        onClick={() => goNext("/crops/manage/confirm", { actionKey })}
                        disabled={!actionKey}
                    >
                        {t("button.next") || "Next"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* ------------------------------ Step: Confirm ----------------------------- */

function StepConfirm() {
    const { t } = useTranslation();
    const { data, goBack, ensure } = useWizardNav();
    const navigate = useNavigate();
    const query = useQuery();
    const returnTo = query.get("returnTo") || "/dashboard";

    React.useEffect(() => { ensure(["cropId", "actionKey"], "/crops/manage/crop"); }, []); // eslint-disable-line

    const onConfirm = () => {
        const selection = { cropId: data.cropId, actionKey: data.actionKey };
        navigate(returnTo, { replace: true, state: selection });
    };

    return (
        <div>
            <div className="position-sticky top-0" style={{ zIndex: 1020 }}>
                <Alert variant="secondary" className="rounded-0 text-center py-3 mb-0">
                    <div className="fw-bold fs-4">{t("crop.manage") || "Manage crop"}</div>
                    <div className="fs-6">{t("crop.confirm") || "Confirm"}</div>
                </Alert>
            </div>

            <div className="p-3" style={{ maxWidth: 560, margin: "0 auto" }}>
                <div className="border rounded p-3 mb-3">
                    <div className="mb-1"><strong>{t("crop.selectedCrop") || "Crop ID"}:</strong> {data.cropId || "—"}</div>
                    <div className="mb-1"><strong>{t("action.selected") || "Action"}:</strong> {data.actionKey || "—"}</div>
                </div>

                <div className="d-flex gap-2">
                    <Button variant="secondary" className="w-50" onClick={() => goBack("/crops/manage/action")}>
                        {t("button.back") || "Back"}
                    </Button>
                    <Button className="w-50 fw-bold" onClick={onConfirm}>
                        {t("button.confirm") || "Confirm"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* --------------------------------- Router --------------------------------- */

export default function CropManageWizard() {
    return (
        <WizardProvider>
            <Routes>
                <Route index element={<Navigate to="/crops/manage/crop" replace />} />
                <Route path="crop" element={<StepSelectCrop />} />
                <Route path="action" element={<StepSelectAction />} />
                <Route path="confirm" element={<StepConfirm />} />
                <Route path="*" element={<Navigate to="/crops/manage/crop" replace />} />
            </Routes>
        </WizardProvider>
    );
}
