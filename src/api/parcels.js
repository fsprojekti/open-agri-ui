// src/api/farmPlots.js
import Cookies from 'js-cookie';
import { SERVICES } from '../config.js';



// Prefer a dedicated service if you have one; fall back to gatekeeper
const BASE = (SERVICES.farmCalendar && SERVICES.farmCalendar.baseURL) || SERVICES.gatekeeper.baseURL;


export async function fetchParcels() {
    const token = Cookies.get('jwt');
    if (!token) throw new Error('Not authenticated');

    const res = await fetch(`${BASE}/v1/FarmParcels/?parcel_type=FIELD`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
        // credentials: 'include' // only if you truly need cookies sent to another origin
    });

    if (!res.ok) {
        const msg = await res.text().catch(() => '');
        throw new Error(`Failed to fetch farm plots (${res.status}) ${msg}`);
    }

    return res.json();
}

export async function fetchParcelsUser() {
    const token = Cookies.get('jwt');
    if (!token) throw new Error('Not authenticated');

    const res = await fetch(`${BASE}/v1/FarmParcels/?parcel_type=FIELD`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
        // credentials: 'include' // only if you truly need cookies sent to another origin
    });

    if (!res.ok) {
        const msg = await res.text().catch(() => '');
        throw new Error(`Failed to fetch farm plots (${res.status}) ${msg}`);
    }

    return res.json();
}

export async function addParcel(dataParcel) {
    const token = Cookies.get("jwt");
    if (!token) throw new Error("Not authenticated");

    // Pick base URL (Vite proxy in dev; service URL in prod)
    const BASE = import.meta.env.DEV
        ? "/farmcalendar"
        : (SERVICES.farmcalendar?.baseURL || SERVICES.farmCalendar?.baseURL || SERVICES.gatekeeper.baseURL);

    // --- helpers ---
    const toTwoDecimalString = (n) => {
        const num = Number(n);
        if (!isFinite(num)) throw new Error("Invalid area: sizeHa must be a number");
        return num.toFixed(2); // schema: string decimal with up to 2 dp
    };
    const toIso = (d) =>
        typeof d === "string" ? d : (d instanceof Date ? d.toISOString() : new Date().toISOString());

    // --- extract + validate required fields ---
    const lng = Number(dataParcel?.center?.lng);
    const lat = Number(dataParcel?.center?.lat);
    if (!isFinite(lng) || !isFinite(lat)) throw new Error("Invalid center coordinates");

    const sizeHa = Number(dataParcel?.sizeHa);
    if (!isFinite(sizeHa) || sizeHa <= 0) throw new Error("Invalid area: sizeHa must be > 0");

    const farmId = String(dataParcel?.farmId ?? dataParcel?.farm?.id ?? dataParcel?.farm?.['@id'] ?? '').match(/[0-9a-f-]{36}$/i)?.[0];
    if (!farmId) throw new Error("Missing farm id (farmId or farm.id)");

    // --- optional fields (all from the same dataParcel) ---
    const nowIso = toIso(dataParcel?.validFrom || new Date());
    const validToIso = toIso(dataParcel?.validTo || "9999-12-31T00:00:00Z");

    const flags = {
        isNitroArea: false,
        isNatura2000Area: false,
        isPdopgArea: false,
        isIrrigated: false,
        isCultivatedInLevels: false,
        isGroundSlope: false,
        ...(dataParcel?.flags || {}),
    };

    const identifier =
        dataParcel?.identifier ||
        `PAR-${nowIso.slice(0, 10)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const wktPoint = (lng, lat) => `POINT (${Number(lng)} ${Number(lat)})`;

    const payload = {
        status: 1,
        identifier,
        description: dataParcel?.description ?? null,

        validFrom: nowIso,
        validTo: validToIso,

        area: toTwoDecimalString(sizeHa),
        hasIrrigationFlow: dataParcel?.irrigationFlow ?? null, // required but nullable

        category: dataParcel?.category || "FIELD",
        inRegion: null,
        hasToponym: null,

        ...flags,

        depiction: null,

        // GeometrySerializerField (GeoJSON Point). Swap to Polygon if your API requires.
        hasGeometry: {
            asWKT: wktPoint(lng, lat),
        },


        // LocationSerializerField
        location: { lat:lat, long:lng },

        // required UUID
        farm: farmId,
    };

    // IMPORTANT: keep this path consistent with your vite proxy rewrite:
    //  - If '/farmcalendar' -> '/api' then '/v1/FarmParcels/' is correct.
    //  - If '/farmcalendar' -> '/api/v1' then call '/FarmParcels/' instead.
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
        console.log("[createFarmParcelFromData →]", url, payload);
        console.log("[createFarmParcelFromData ←]", res.status, res.statusText);
    }

    if (!res.ok) {
        let msg = "";
        try { msg = await res.text(); } catch {}
        throw new Error(`Failed to create parcel (${res.status}) ${msg}`);
    }

    return res.json();
}

