// src/api/beehives.js
import Cookies from "js-cookie";
import { SERVICES } from "../config.js";

/**
 * Fetch beehives from the server (FarmAnimals).
 * Optional filter by apiary (FarmParcel) via `apiaryId` — if the backend
 * doesn't support a query param, we filter client-side after fetching.
 *
 * @param {Object} [opts]
 * @param {string} [opts.apiaryId] - UUID of the apiary FarmParcel
 * @returns {Promise<Array|Object>} server JSON
 */
export async function fetchBeehives(opts = {}) {
    const token = Cookies.get("jwt");
    if (!token) throw new Error("Not authenticated");

    // Prefer Vite proxy in dev; service URL in prod
    const BASE = import.meta.env.DEV
        ? "/farmcalendar"
        : (SERVICES.farmcalendar?.baseURL || SERVICES.farmCalendar?.baseURL || SERVICES.gatekeeper.baseURL);

    // Base endpoint; if your API supports filtering, you could add e.g. `?hasAgriParcel=<uuid>`
    const url = `${BASE}/v1/FarmParcels/?parcel_type=BEEHIVE`;

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
        throw new Error(`Failed to fetch beehives (${res.status}) ${msg}`);
    }

    const data = await res.json();

    // Normalize to array
    const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.items) ? data.items
            : Array.isArray(data?.results) ? data.results
                : Array.isArray(data?.data) ? data.data
                    : [];

    // Optional client-side filter by apiaryId (FarmParcel UUID)
    const { apiaryId } = opts || {};
    if (!apiaryId) return data;

    const matchUuid = (s) => String(s || "").match(/[0-9a-f-]{36}$/i)?.[0] || "";
    const filtered = list.filter((a) => matchUuid(a?.hasAgriParcel) === matchUuid(apiaryId));

    // Preserve original shape if it wasn't a plain array
    if (Array.isArray(data)) return filtered;
    if (Array.isArray(data?.items)) return { ...data, items: filtered };
    if (Array.isArray(data?.results)) return { ...data, results: filtered };
    if (Array.isArray(data?.data)) return { ...data, data: filtered };
    return filtered;
}

/**
 * Create a beehive entry (FarmAnimal) and associate it to an apiary (FarmParcel).
 * This matches your BeehiveAddWizard fields.
 *
 * Input shape (all optional unless noted):
 *  {
 *    apiaryId: string (UUID)              // REQUIRED (FarmParcel UUID)
 *    code: string                          // used as nationalID + name
 *    model?: string                        // mapped to 'breed'
 *    frames?: number                       // appended to description
 *    notes?: string                        // description
 *    species?: string                      // default 'Apis mellifera'
 *    birthdate?: string|Date               // default now (ISO)
 *    sex?: number                          // optional (enum per backend)
 *    isCastrated?: boolean                 // default false
 *    status?: number                       // default 1
 *  }
 */
export async function addBeehive(input) {
    const token = Cookies.get("jwt");
    if (!token) throw new Error("Not authenticated");

    const BASE = import.meta.env.DEV
        ? "/farmcalendar"
        : (SERVICES.farmcalendar?.baseURL || SERVICES.farmCalendar?.baseURL || SERVICES.gatekeeper.baseURL);

    const toIso = (d) =>
        typeof d === "string" ? d : (d instanceof Date ? d.toISOString() : new Date().toISOString());

    // Validate apiary ID (FarmParcel UUID)
    const apiaryUuid = String(
        input?.apiaryId ??
        input?.apiary?.id ??
        input?.apiary?.["@id"] ??
        ""
    ).match(/[0-9a-f-]{36}$/i)?.[0];
    if (!apiaryUuid) throw new Error("Missing apiaryId (FarmParcel UUID)");

    const code = (input?.code || "").toString().trim();
    if (!code) throw new Error("Missing beehive code (used as nationalID/name)");

    const species = (input?.species || "Apis mellifera").toString().trim();
    const birthdate = toIso(input?.birthdate || new Date());

    // Optional fields
    const model = (input?.model || "").toString().trim();

    // Build description from notes (+ frames if provided)
    const description = apiaryUuid;

    // Construct FarmAnimal payload (per schema)
    const payload = {
        // required
        species,                // string
        birthdate,              // ISO datetime
        hasAgriParcel: apiaryUuid, // UUID of the apiary FarmParcel

        // optional/common
        nationalID: code,       // use beehive code as a stable identifier
        name: code,             // human label
        description,            // composed text

        breed: model || null,   // store beehive "model" here
        sex: input?.sex,        // optional enum (leave undefined if unknown)
        isCastrated: !!input?.isCastrated, // defaults to false if not provided
        status: Number.isFinite(+input?.status) ? +input.status : 1, // default active
    };

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
        console.log("[addBeehive →]", url, payload);
        console.log("[addBeehive ←]", res.status, res.statusText);
    }

    if (!res.ok) {
        let msg = "";
        try { msg = await res.text(); } catch {}
        throw new Error(`Failed to create beehive (${res.status}) ${msg}`);
    }

    return res.json();
}
