// file: src/components/ParcelSearchSelect.jsx
import React from "react";
import { Form, InputGroup, Button } from "react-bootstrap";
import useDb from "../contexts/useDb.js";

function parcelItemsFromDb(parcels = []) {
    return parcels.map((p) => {
        const uuid = String(p?.["@id"] ?? p?.id ?? "").match(/[0-9a-f-]{36}$/i)?.[0] || "";
        const label = p?.identifier || `Parcel ${uuid.slice(0, 8)} — ${p?.area ?? "?"} ha`;
        return { value: uuid, label };
    });
}

/**
 * ParcelSearchSelect
 *
 * Props:
 * - value: string (selected parcel UUID)
 * - onChange: (value: string) => void
 * - label?: string (default "Select parcel")
 * - placeholder?: string (default "Search parcels…")
 * - disabled?: boolean
 */
export default function ParcelSearchSelect({
                                         value,
                                         onChange,
                                         label = "Select parcel",
                                         placeholder = "Search parcels…",
                                         disabled = false,
                                     }) {
    const { parcels } = useDb();

    const items = React.useMemo(() => parcelItemsFromDb(parcels), [parcels]);
    const [query, setQuery] = React.useState("");

    // Filter by label (case-insensitive)
    const filtered = React.useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return items;
        return items.filter((it) => (it.label || "").toLowerCase().includes(q));
    }, [items, query]);

    const handlePick = (val) => {
        if (disabled) return;
        onChange?.(val);
    };

    const handleClear = () => {
        setQuery("");
        onChange?.("");
    };

    const ROW_H = 52;
    const VISIBLE_ROWS = 5;
    const maxHeight = ROW_H * VISIBLE_ROWS;

    return (
        <div>
            {label && <Form.Label className="fw-semibold">{label}</Form.Label>}

            <InputGroup className="mb-2">
                <InputGroup.Text aria-hidden="true">
                    {/* magnifying glass icon */}
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" role="img" aria-label="Search">
                        <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.415l-3.85-3.85h-.017zm-5.242.656a5 5 0 1 1 0-10.001 5 5 0 0 1 0 10.001z"/>
                    </svg>
                </InputGroup.Text>
                <Form.Control
                    autoFocus
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
                style={{ maxHeight, overflowY: "auto", scrollbarGutter: "stable" }}
            >
                {filtered.length === 0 ? (
                    <div className="p-3 text-muted">No matches</div>
                ) : (
                    <div className="list-group list-group-flush">
                        {filtered.map((it, idx) => {
                            const selected = it.value === value;
                            const stripe = !selected && idx % 2 === 1
                                ? { backgroundColor: "rgba(0,0,0,0.03)" }
                                : undefined;

                            return (
                                <button
                                    key={it.value || it.label}
                                    type="button"
                                    className={`list-group-item list-group-item-action d-flex align-items-center justify-content-between ${selected ? "active" : ""}`}
                                    onClick={() => handlePick(it.value)}
                                    disabled={disabled}
                                    style={{ cursor: disabled ? "not-allowed" : "pointer", ...stripe }}
                                >
                                    <div className={`text-start text-truncate ${selected ? "text-white" : ""}`}>
                                        {it.label}
                                    </div>
                                    <Form.Check
                                        type="radio"
                                        name="parcel-search"
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
                {query ? ` "${query}"` : ""}.
            </div>
        </div>
    );
}
