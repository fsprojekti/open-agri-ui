// file: src/components/BeehiveSearch.jsx
import React from "react";
import { Form, InputGroup, Button } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import useDb from "../contexts/useDb.js";

const matchUuid = (s) => String(s || "").match(/[0-9a-f-]{36}$/i)?.[0] || "";

/**
 * BeehiveSearch (scrollable list with radio select, i18n-ready)
 *
 * Props:
 * - items?: Array<{ value, label }>. If omitted, builds from DbContext.beehives
 * - value: string (selected beehive UUID)
 * - onChange: (value: string) => void
 * - apiaryId?: string (UUID of parent apiary to filter)
 * - placeholder?: string (default t('beehive.searchPlaceholder'))
 * - label?: string (default t('beehive.select'))
 * - getValue?: (item) => string (default item.value)
 * - getLabel?: (item) => string (default item.label)
 * - autoFocus?: boolean (default true)
 * - disabled?: boolean (default false)
 * - emptyText?: string (default t('common.noMatches'))
 */
export default function BeehiveSearch({
                                          items,
                                          value,
                                          onChange,
                                          apiaryId,
                                          placeholder,
                                          label,
                                          getValue = (i) => i?.value ?? "",
                                          getLabel = (i) => i?.label ?? "",
                                          autoFocus = true,
                                          disabled = false,
                                          emptyText,
                                      }) {
    const { t } = useTranslation();
    const { beehives } = useDb();

    // i18n defaults
    const _label = label ?? (t("beehive.select") || "Select beehive");
    const _placeholder = placeholder ?? (t("beehive.searchPlaceholder") || "Search beehives…");
    const _emptyText = emptyText ?? (t("common.noMatches") || "No matches");
    const clearLabel = t("common.clear") || "Clear";
    const ariaSearch = t("beehive.aria.search") || "Search";
    const ariaPick = t("beehive.aria.selectBeehive") || "Select this beehive";
    const resultsWord =
        (n) => t(n === 1 ? "common.result" : "common.results") || (n === 1 ? "result" : "results");
    const scrollHint = t("common.scrollForMore") || " (scroll for more)";

    // Build defaults from DB beehives
    const defaultItems = React.useMemo(() => {
        const list = Array.isArray(beehives) ? beehives : [];

        const filteredByApiary = apiaryId
            ? list.filter((h) => {
                const hApiary = matchUuid(
                    h?.apiary?.["@id"] ?? h?.apiary?.id ?? h?.inApiary ?? h?.hasAgriParcel
                );
                return hApiary === matchUuid(apiaryId);
            })
            : list;

        return filteredByApiary.map((h) => {
            const uuid = matchUuid(h?.["@id"] ?? h?.id);
            const code = h?.code || h?.nationalID || h?.identifier || `Hive ${uuid.slice(0, 8)}`;
            const model = h?.model || h?.breed;
            const modelPart = model ? ` — ${model}` : "";
            return { value: uuid || code, label: `${code}${modelPart}`, raw: h };
        });
    }, [beehives, apiaryId]);

    const effectiveItems = items && items.length ? items : defaultItems;

    const [query, setQuery] = React.useState("");

    const filtered = React.useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return effectiveItems;
        return effectiveItems.filter((it) => (getLabel(it) || "").toLowerCase().includes(q));
    }, [effectiveItems, query, getLabel]);

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
            {_label && <Form.Label className="fw-semibold">{_label}</Form.Label>}

            <InputGroup className="mb-2">
                <InputGroup.Text aria-hidden="true">
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

            <div className="border rounded" style={{ maxHeight, overflowY: "auto", scrollbarGutter: "stable" }}>
                {filtered.length === 0 ? (
                    <div className="p-3 text-muted">{_emptyText}</div>
                ) : (
                    <div className="list-group list-group-flush">
                        {filtered.map((it, idx) => {
                            const v = getValue(it);
                            const l = getLabel(it);
                            const selected = v === value;
                            const stripe = !selected && idx % 2 === 1 ? { backgroundColor: "rgba(0,0,0,0.03)" } : undefined;

                            return (
                                <button
                                    key={v || l}
                                    type="button"
                                    className={`list-group-item list-group-item-action d-flex align-items-center justify-content-between ${selected ? "active" : ""}`}
                                    onClick={() => handlePick(v)}
                                    disabled={disabled}
                                    style={{ cursor: disabled ? "not-allowed" : "pointer", ...stripe }}
                                >
                                    <div className={`text-start text-truncate ${selected ? "text-white" : ""}`}>{l}</div>
                                    <Form.Check
                                        type="radio"
                                        name="beehive-select"
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
