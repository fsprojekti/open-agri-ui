// file: src/components/ParcelSearchSelect.jsx
import React from "react";
import { Form, InputGroup, Button } from "react-bootstrap";

/**
 * ParcelSearchSelect (scrollable list with radio select)
 *
 * Props:
 * - items: Array of items. Each can be { value, label } or any shape with getValue/getLabel.
 * - value: currently selected value (string)
 * - onChange: (value) => void
 * - placeholder: string for the search input
 * - label: string label above the control
 * - getValue: (item) => string (default: item.value)
 * - getLabel: (item) => string (default: item.label)
 * - autoFocus: boolean (default true)
 * - disabled: boolean
 * - emptyText: text shown when no matches (default: "No matches")
 *
 * Behavior:
 * - Shows ALL filtered items in a scrollable area with a fixed height (~5 rows).
 * - Alternating row colors for readability; selected row is always Bootstrap blue.
 * - Click row or radio to select. Clear button resets search and selection.
 */
export default function ParcelSearchSelect({
                                               items = [],
                                               value,
                                               onChange,
                                               placeholder = "Search parcels…",
                                               label = "Select parcel",
                                               getValue = (i) => i?.value ?? "",
                                               getLabel = (i) => i?.label ?? "",
                                               autoFocus = true,
                                               disabled = false,
                                               emptyText = "No matches",
                                           }) {
    const [query, setQuery] = React.useState("");

    // Filter (case-insensitive, matches label)
    const filtered = React.useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return items;
        return items.filter((it) => getLabel(it).toLowerCase().includes(q));
    }, [items, query, getLabel]);

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
            {label && <Form.Label className="fw-semibold">{label}</Form.Label>}

            <InputGroup className="mb-2">
                <InputGroup.Text aria-hidden="true">
                    {/* inline magnifying glass icon */}
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" role="img" aria-label="Search">
                        <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.415l-3.85-3.85h-.017zm-5.242.656a5 5 0 1 1 0-10.001 5 5 0 0 1 0 10.001z"/>
                    </svg>
                </InputGroup.Text>
                <Form.Control
                    autoFocus={autoFocus}
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                />
                {(query || value) && (
                    <Button variant="outline-secondary" onClick={handleClear} disabled={disabled}>
                        Clear
                    </Button>
                )}
            </InputGroup>

            <div
                className="border rounded"
                style={{
                    maxHeight,
                    overflowY: "auto",         // always scrollable window
                    scrollbarGutter: "stable", // reserve space for scrollbar
                }}
            >
                {filtered.length === 0 ? (
                    <div className="p-3 text-muted">{emptyText}</div>
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
                                        ...stripe,
                                    }}
                                >
                                    <div className={`text-start text-truncate ${selected ? "text-white" : ""}`}>
                                        {l}
                                    </div>
                                    <Form.Check
                                        type="radio"
                                        name="parcel-select"
                                        checked={selected}
                                        readOnly
                                        aria-label="Select this parcel"
                                        className={selected ? "text-white" : ""}
                                    />
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="small text-muted mt-2">
                {filtered.length} {filtered.length === 1 ? "result" : "results"}
                {filtered.length > VISIBLE_ROWS ? " (scroll for more)" : ""}
                {query ? ` for "${query}"` : ""}.
            </div>
        </div>
    );
}
