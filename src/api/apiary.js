// src/api/apiaries.js
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
/**
 * Optional helper to list apiaries (FarmParcels with category 'apiary').
 * You can delete this if you don't need it.
 */
export async function fetchApiaries() {
    const token = Cookies.get("jwt");
    if (!token) throw new Error("Not authenticated");

    // Prefer a dedicated service in prod; use Vite proxy in dev
    const BASE = import.meta.env.DEV
        ? "/farmcalendar"
        : (SERVICES.farmcalendar?.baseURL || SERVICES.farmCalendar?.baseURL || SERVICES.gatekeeper.baseURL);

    // If your backend supports filtering by category via query params, you can append ?category=apiary
    const url = `${BASE}/v1/FarmParcels/?parcel_type=APIARY`;

    const res = await fetch(url, {
        method: "GET",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(`Failed to fetch apiaries (${res.status}) ${msg}`);
    }

    return res.json();
}

/**
 * Create an Apiary entry using the FarmParcel schema.
 * Required shape (input `dataApiary`):
 *  {
 *    center: { lng, lat },        // required
 *    farmId | farm: { id | @id }, // required (UUID or IRI containing UUID)
 *    name?: string,               // used as identifier/toponym if provided
 *    description?: string,
 *    areaHa?: number,             // optional, defaults to 0.00
 *    flags?: { ... }              // optional boolean flags to override defaults
 *  }
 */
export async function addApiary(dataApiary) {
    const token = Cookies.get("jwt");
    if (!token) throw new Error("Not authenticated");

    // Prefer Vite proxy in dev; service URL in prod
    const BASE = import.meta.env.DEV
        ? "/farmcalendar"
        : (SERVICES.farmcalendar?.baseURL || SERVICES.farmCalendar?.baseURL || SERVICES.gatekeeper.baseURL);

    // ---- helpers ----
    const toTwoDecimalString = (n) => {
        const num = Number(n);
        if (!isFinite(num)) throw new Error("Invalid area: areaHa must be a number");
        return num.toFixed(2); // schema expects decimal string with up to 2 dp
    };
    const toIso = (d) =>
        typeof d === "string" ? d : (d instanceof Date ? d.toISOString() : new Date().toISOString());

    const wktPoint = (lng, lat) => `POINT (${Number(lng)} ${Number(lat)})`;

    // ---- required fields & validation ----
    const lng = Number(dataApiary?.center?.lng);
    const lat = Number(dataApiary?.center?.lat);
    if (!isFinite(lng) || !isFinite(lat)) throw new Error("Invalid center coordinates");

    // Extract farm UUID from several possible shapes
    const farmId =
        String(
            dataApiary?.farmId ??
            dataApiary?.farm?.id ??
            dataApiary?.farm?.["@id"] ??
            ""
        ).match(/[0-9a-f-]{36}$/i)?.[0];
    if (!farmId) throw new Error("Missing farm id (farmId or farm.id)");

    // ---- optional inputs ----
    const nowIso = toIso(dataApiary?.validFrom || new Date());
    const validToIso = toIso(dataApiary?.validTo || "9999-12-31T00:00:00Z");

    const providedName = (dataApiary?.name || "").toString().trim();
    const identifier =
        dataApiary?.identifier ||
        (providedName
            ? `APIARY-${providedName}`
            : `APIARY-${nowIso.slice(0, 10)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`);

    // Defaults for required-but-nullable fields + boolean flags
    const flags = {
        isNitroArea: false,
        isNatura2000Area: false,
        isPdopgArea: false,
        isIrrigated: false,
        isCultivatedInLevels: false,
        isGroundSlope: false,
        ...(dataApiary?.flags || {}),
    };

    // Area is optional for apiaries; default to 0.00 if not provided
    const area = toTwoDecimalString(dataApiary?.areaHa ?? 0);

    // ---- payload per FarmParcel schema ----
    const payload = {
        status: 1,
        identifier,                               // string (<=255)
        description: dataApiary?.description ?? null,

        validFrom: nowIso,                         // ISO datetime
        validTo: validToIso,                       // ISO datetime

        area,                                      // decimal string (0.00 default)
        hasIrrigationFlow: null,                   // required but nullable

        category: "APIARY",                        // <— BEEHIVE for apiaries
        inRegion: null,                            // required (nullable)
        hasToponym: providedName || null,          // required (nullable) – store name here if provided

        ...flags,                                  // required booleans

        depiction: null,                           // nullable URI

        hasGeometry: {                             // GeometrySerializerField
            asWKT: wktPoint(lng, lat),
        },

        location: {                                // LocationSerializerField
            lat: lat,
            long: lng,
        },

        farm: farmId,                              // required UUID
    };

    const url = `${BASE}/v1/FarmParcels/`;

    const res = await fetch(url, {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    if (import.meta.env.DEV) {
        console.log("[addApiary →]", url, payload);
        console.log("[addApiary ←]", res.status, res.statusText);
    }

    if (!res.ok) {
        let msg = "";
        try {
            msg = await res.text();
        } catch {}
        throw new Error(`Failed to create apiary (${res.status}) ${msg}`);
    }

    return res.json();
}
/**
 * Create an apiary observation record.
 *
 * Required in `data`:
 *   - apiaryId        (uuid string)
 *   - observationType (object with at least { value: string })
 *   - observationValue (string or number)
 *
 * Optional:
 *   - unit            (string | null) — if provided, will be sent in hasResult.unit
 *   - phenomenonTime  (ISO string) — defaults to current timestamp
 *   - observedProperty (string) — defaults to the observation type value
 *
 * You may need to adjust the endpoint or payload structure to match your backend.
 */
export async function addApiaryObservation(data) {
    const token = Cookies.get("jwt");
    if (!token) throw new Error("Not authenticated");

    const apiaryId = String(data?.apiaryId ?? "").trim();
    if (!apiaryId) throw new Error("apiaryId is required");

    const obsValue = data?.observationType?.value || data?.observationType || "";
    if (!obsValue) throw new Error("observationType is required");

    const value = String(data?.observationValue ?? "").trim();
    if (!value) throw new Error("observationValue is required");

    // Determine base URL (dev uses Vite proxy)
    const BASE = import.meta.env.DEV
        ? "/farmcalendar"
        : (SERVICES.farmcalendar?.baseURL ||
            SERVICES.farmCalendar?.baseURL ||
            SERVICES.gatekeeper.baseURL);



    const payload = {
        activityType: null, // adjust if your backend needs a specific FarmCalendarActivityId
        hasResult: {
            unit: data?.unit ?? null,
            hasValue: value,
        },
        hasAgriParcel: apiaryId,
        phenomenonTime: data?.phenomenonTime || new Date().toISOString(),
        observedProperty: data?.observedProperty || obsValue,
    };

    const res = await fetch(`${BASE}/v1/ApiaryObservations/`, {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    if (import.meta.env.DEV) {
        console.log("[addApiaryObservation] →", payload);
        console.log("[addApiaryObservation] ←", res.status, res.statusText);
    }

    if (!res.ok) {
        let msg = "";
        try { msg = await res.text(); } catch {}
        throw new Error(`Failed to create apiary observation (${res.status}) ${msg}`);
    }

    return res.json();
}

export async function fetchApiaryObservationTypes() {
    const token = Cookies.get("jwt");
    if (!token) throw new Error("Not authenticated");

    const url = `${getBase()}/v1/FarmCalendarActivityTypes/?category=observation&name=Apiary Observation`;
    const res = await fetch(url, {
        headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
        },
    });
    if (!res.ok) {
        let msg = "";
        try {
            msg = await res.text();
        } catch {
        }
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


