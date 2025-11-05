import Cookies from "js-cookie";
import { SERVICES } from "../config.js";

/**
 * Base URL:
 * - DEV: use Vite proxy key `/farmcalendar`
 * - PROD: use configured service URL (fallbacks kept for your config variants)
 */
function getBase() {
    return import.meta.env.DEV
        ? "/farmcalendar"
        : (SERVICES.farmcalendar?.baseURL || SERVICES.farmCalendar?.baseURL || SERVICES.gatekeeper.baseURL);
}

const BASE = (SERVICES.farmCalendar?.baseURL) || SERVICES.gatekeeper.baseURL;

/**
 * Create a FarmCrop
 *
 * Required in `data`:
 *   - parcelId        (uuid string)
 *   - name            (string, <= 100)
 *   - cropSpecies     (object) with BOTH:
 *        { name: "<string>", variety: "<string>" }
 *
 * Optional in `data`:
 *   - description     (string|null)
 *   - growthStage     (string|null, <= 255)
 *   - status          (number) default 1
 *
 * Returns created crop JSON.
 */
export async function addCrop(data) {
    const token = Cookies.get("jwt");
    if (!token) throw new Error("Not authenticated");

    // --- required fields ---
    const parcelId = String(data?.parcelId ?? "").trim();
    if (!parcelId) throw new Error("parcelId is required");

    let name = String(data?.name ?? data?.cropName ?? "").trim();
    if (!name) throw new Error("name is required");
    if (name.length > 100) name = name.slice(0, 100);

    //Check for variety
    let variety = String(data?.variety ?? "").trim();
    if (!variety) throw new Error("variety is required");



    // --- optional fields ---
    const description = data?.description ?? null;
    let growth_stage = data?.growthStage ?? null;
    if (growth_stage != null) {
        growth_stage = String(growth_stage);
        if (growth_stage.length > 255) growth_stage = growth_stage.slice(0, 255);
    }

    const payload = {
        status: Number.isFinite(data?.status) ? data.status : 1,
        name,
        description,
        hasAgriParcel: parcelId,
        cropSpecies: { name: name, variety: variety },
        growth_stage,
        // readOnly: id, dateCreated, dateModified, invalidatedAtTime are server-set
    };

    const res = await fetch(`${BASE}/v1/FarmCrops/`, {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        let msg = "";
        try { msg = await res.text(); } catch {}
        throw new Error(`Failed to create crop (${res.status}) ${msg}`);
    }

    return res.json();
}

/**
 * Fetch crops list (shape-agnostic array unwrap).
 */
export async function fetchCrops() {
    const token = Cookies.get("jwt");
    if (!token) throw new Error("Not authenticated");

    const url = `${getBase()}/v1/FarmCrops/`;
    const res = await fetch(url, {
        headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
        },
    });
    if (!res.ok) {
        let msg = "";
        try { msg = await res.text(); } catch {}
        throw new Error(`Failed to fetch crops (${res.status}) ${msg}`);
    }
    const data = await res.json();
    // unwrap common envelope shapes
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.results)) return data.results;
    if (Array.isArray(data?.data)) return data.data;
    return [];
}
