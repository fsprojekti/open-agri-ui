// file: src/components/CropSearchSelect.jsx
import React from "react";
import { Form, InputGroup, Button } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import useDb from "../contexts/useDb.js";

/**
 * CropSearchSelect (scrollable list with radio select, i18n-ready)
 *
 * Props (same shape as ParcelSearchSelect):
 * - items: optional Array. If omitted, pulls from DbContext.cropSpeciesOptions
 *          Each item can be { value, label } or any shape with getValue/getLabel.
 * - value: currently selected value (string)
 * - onChange: (value) => void
 * - placeholder: string for the search input (default: t('crop.searchPlaceholder'))
 * - label: string label above the control (default: t('crop.selectSpecies'))
 * - getValue: (item) => string (default: item.value)
 * - getLabel: (item) => string (default: item.label)
 * - autoFocus: boolean (default true)
 * - disabled: boolean
 * - emptyText: text when no matches (default: t('common.noMatches'))
 *
 * Behavior:
 * - Shows ALL filtered items in a scrollable area with fixed height (~5 rows).
 * - Alternating row colors for readability; selected row is always Bootstrap blue.
 * - Click row or radio to select. Clear button resets search and selection.
 */
export default function CropSearchSelect({
                                             items,
                                             value,
                                             onChange,
                                             placeholder,
                                             label,
                                             getValue = (i) => i?.value ?? "",
                                             getLabel = (i) => i?.label ?? "",
                                             autoFocus = true,
                                             disabled = false,
                                             emptyText
                                         }) {
    const { t } = useTranslation();
    const { cropSpeciesOptions } = useDb();

    // i18n defaults (used only if caller didn't pass their own)
    const _label = label ?? (t("crop.selectSpecies") || "Select crop species");
    const _placeholder = placeholder ?? (t("crop.searchPlaceholder") || "Search crops…");
    const _emptyText = emptyText ?? (t("common.noMatches") || "No matches");
    const clearLabel = t("common.clear") || "Clear";
    const ariaSearch = t("crop.aria.search") || "Search";
    const ariaPick = t("crop.aria.selectSpecies") || "Select this crop species";
    const resultsWord =
        (value) => t(value === 1 ? "common.result" : "common.results") || (value === 1 ? "result" : "results");
    const scrollHint = t("common.scrollForMore") || " (scroll for more)";

    // If caller didn't pass items, build them from context (already localized labels)
    const defaultItems = React.useMemo(
        () =>
            (cropSpeciesOptions || []).map((o) => ({
                value: o.value,   // stable key like "zea_mays__grain_maize"
                label: o.label,   // localized label (via DbProvider/i18n)
                name: o.name,     // canonical for API if you need it
                variety: o.variety
            })),
        [cropSpeciesOptions]
    );

    const effectiveItems = items && items.length ? items : defaultItems;

    const [query, setQuery] = React.useState("");

    // Filter (case-insensitive, matches label)
    const filtered = React.useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return effectiveItems;
        return effectiveItems.filter((it) => getLabel(it).toLowerCase().includes(q));
    }, [effectiveItems, query, getLabel]);

    const handlePick = (val) => {
        if (disabled) return;
        onChange?.(val);
    };

    // Clear both the search and the current selection
    const handleClear = () => {
        setQuery("");
        onChange?.("");
    };

    // Approx row height and window size (5 rows)
    const ROW_H = 52;
    const VISIBLE_ROWS = 5;
    const maxHeight = ROW_H * VISIBLE_ROWS;

    return (
        <div>
            {_label && <Form.Label className="fw-semibold">{_label}</Form.Label>}

            <InputGroup className="mb-2">
                <InputGroup.Text aria-hidden="true">
                    {/* inline magnifying glass icon */}
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" role="img" aria-label={ariaSearch}>
                        <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.415l-3.85-3.85h-.017zm-5.242.656a5 5 0 1 1 0-10.001 5 5 0 0 1 0 10.001z"/>
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

            <div
                className="border rounded"
                style={{
                    maxHeight,
                    overflowY: "auto",         // always scrollable window
                    scrollbarGutter: "stable"  // reserve space for scrollbar
                }}
            >
                {filtered.length === 0 ? (
                    <div className="p-3 text-muted">{_emptyText}</div>
                ) : (
                    <div className="list-group list-group-flush">
                        {filtered.map((it, idx) => {
                            const v = getValue(it);
                            const l = getLabel(it);
                            const selected = v === value;

                            // stripe only when NOT selected so active blue always shows
                            const stripe = !selected && idx % 2 === 1
                                ? { backgroundColor: "rgba(0,0,0,0.03)" }
                                : undefined;

                            return (
                                <button
                                    key={v || l}
                                    type="button"
                                    className={`list-group-item list-group-item-action d-flex align-items-center justify-content-between ${selected ? "active" : ""}`}
                                    onClick={() => handlePick(v)}
                                    disabled={disabled}
                                    style={{
                                        cursor: disabled ? "not-allowed" : "pointer",
                                        ...stripe
                                    }}
                                >
                                    <div className={`text-start text-truncate ${selected ? "text-white" : ""}`}>
                                        {l}
                                    </div>
                                    <Form.Check
                                        type="radio"
                                        name="crop-select"
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
