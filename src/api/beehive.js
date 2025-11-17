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
export async function addBeehive(dataBeehive) {
    const token = Cookies.get("jwt");
    if (!token) throw new Error("Not authenticated");

    // Prefer Vite proxy in dev; service URL in prod
    const BASE = import.meta.env.DEV
        ? "/farmcalendar"
        : (SERVICES.farmcalendar?.baseURL || SERVICES.farmCalendar?.baseURL || SERVICES.gatekeeper.baseURL);



    // Extract farm UUID from several possible shapes
    const farmId =
        String(
            dataBeehive?.farmId ??
            dataBeehive?.farm?.id ??
            dataBeehive?.farm?.["@id"] ??
            ""
        ).match(/[0-9a-f-]{36}$/i)?.[0];
    if (!farmId) throw new Error("Missing farm id (farmId or farm.id)");

    const flags = {
        isNitroArea: false,
        isNatura2000Area: false,
        isPdopgArea: false,
        isIrrigated: false,
        isCultivatedInLevels: false,
        isGroundSlope: false,
        ...(dataBeehive?.flags || {}),
    };

    let lat= Number(dataBeehive.apiaryParcel.location.lat);
    //Move point randomly by less than 1m
    let lng= Number(dataBeehive.apiaryParcel.location.long);
    const randomOffset = () => (Math.random() - 0.5) * 0.00001; // ~1m
    lat += randomOffset();
    lng += randomOffset();
    //Limit to 14 decimal places
    lat = parseFloat(lat.toFixed(14));
    lng = parseFloat(lng.toFixed(14));

    const wktPoint = `POINT (${Number(lng)} ${Number(lat)})`;




    // ---- payload per FarmParcel schema ----
    const payload = {
        status: 1,
        // string (<=255)
        description: dataBeehive?.notes ?? null,
        identifier: dataBeehive?.code,

        area:0,                                      // decimal string (0.00 default)
        hasIrrigationFlow: null,                   // required but nullable

        category: "BEEHIVE",                        // <— BEEHIVE for apiaries
        inRegion:farmId,// ISO datetime                           // required (nullable)
        hasToponym: null,          // required (nullable) – store name here if provided

        ...flags,                                  // required booleans

        depiction: null,                           // nullable URI

        hasGeometry: {
            asWKT: wktPoint,
        },

        location: {
            lat: lat,
            long: lng,
        },

        farm: farmId,                              // required UUID

        validFrom: new Date().toISOString(),                         // ISO datetime

        validTo: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString(),


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
        try {
            msg = await res.text();
        } catch {}
        throw new Error(`Failed to create apiary (${res.status}) ${msg}`);
    }

    return res.json();
}
