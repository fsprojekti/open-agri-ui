// file: src/components/CropObserveTypeSearch.jsx
import React from "react";
import { Form, InputGroup, Button } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import useDb from "../contexts/useDb.js"; // ensure this path matches your project

/**
 * CropObserveTypeSearch (context-sourced)
 *
 * Props:
 * - value: string
 * - onChange: (value: string) => void
 * - placeholder?: string
 * - label?: string
 * - autoFocus?: boolean (default true)
 * - disabled?: boolean (default false)
 * - emptyText?: string
 */
export default function CropObserveTypeSearch({
                                                  value,
                                                  onChange,
                                                  placeholder,
                                                  label,
                                                  autoFocus = true,
                                                  disabled = false,
                                                  emptyText,
                                              }) {
    const { t } = useTranslation();
    const { cropObservationTypeOptions } = useDb(); // ← from DbProvider (now backed by JSON)

    // i18n strings
    const _label = label ?? (t("observation.selectType") || "Select observation type");
    const _placeholder = placeholder ?? (t("observation.searchPlaceholder") || "Search observation types…");
    const _emptyText = emptyText ?? (t("common.noMatches") || "No matches");
    const clearLabel = t("common.clear") || "Clear";
    const ariaSearch = t("observation.aria.search") || "Search";
    const ariaPick = t("observation.aria.selectType") || "Select this observation type";
    const resultsWord = (n) => t(n === 1 ? "common.result" : "common.results") || (n === 1 ? "result" : "results");
    const scrollHint = t("common.scrollForMore") || " (scroll for more)";

    // Items come strictly from context; they're already localized in DbProvider.
    const items = React.useMemo(
        () =>
            Array.isArray(cropObservationTypeOptions)
                ? cropObservationTypeOptions.map((o) => ({ value: String(o.value), label: String(o.label || o.value) }))
                : [],
        [cropObservationTypeOptions]
    );

    const [query, setQuery] = React.useState("");

    const filtered = React.useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return items;
        return items.filter((it) => (it.label || "").toLowerCase().includes(q));
    }, [items, query]);

    const handlePick = (v) => {
        if (disabled) return;
        onChange?.(v);
    };

    const handleClear = () => {
        setQuery("");
        onChange?.("");
    };

    // Layout sizing
    const ROW_H = 52;
    const VISIBLE_ROWS = 5;
    const maxHeight = ROW_H * VISIBLE_ROWS;

    return (
        <div>
            {_label && <Form.Label className="fw-semibold">{_label}</Form.Label>}

            <InputGroup className="mb-2">
                <InputGroup.Text aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" role="img" aria-label={ariaSearch}>
                        <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.415l-3.85-3.85h-.017zm-5.242.656a5 5 0 1 1 0-10.001 5 5 0 0 1 0 10.001z" />
                    </svg>
                </InputGroup.Text>
                <Form.Control
                    autoFocus={autoFocus}
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={_placeholder}
                    disabled={disabled}
                    aria-label={ariaSearch}
                />
                {(query || value) && (
                    <Button variant="outline-secondary" onClick={handleClear} disabled={disabled}>
                        {clearLabel}
                    </Button>
                )}
            </InputGroup>

            <div className="border rounded" style={{ maxHeight, overflowY: "auto", scrollbarGutter: "stable" }}>
                {filtered.length === 0 ? (
                    <div className="p-3 text-muted">{_emptyText}</div>
                ) : (
                    <div className="list-group list-group-flush">
                        {filtered.map((it, idx) => {
                            const selected = it.value === value;
                            const stripe = !selected && idx % 2 === 1 ? { backgroundColor: "rgba(0,0,0,0.03)" } : undefined;

                            return (
                                <button
                                    key={it.value || it.label}
                                    type="button"
                                    className={`list-group-item list-group-item-action d-flex align-items-center justify-content-between ${
                                        selected ? "active" : ""
                                    }`}
                                    onClick={() => handlePick(it.value)}
                                    disabled={disabled}
                                    style={{ cursor: disabled ? "not-allowed" : "pointer", ...stripe }}
                                >
                                    <div className={`text-start text-truncate ${selected ? "text-white" : ""}`}>{it.label}</div>
                                    <Form.Check
                                        type="radio"
                                        name="crop-observe-type-select"
                                        checked={selected}
                                        readOnly
                                        aria-label={ariaPick}
                                        className={selected ? "text-white" : ""}
                                    />
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="small text-muted mt-2">
                {filtered.length} {resultsWord(filtered.length)}
                {filtered.length > VISIBLE_ROWS ? scrollHint : ""}
                {query ? ` "${query}"` : ""}.
            </div>
        </div>
    );
}
