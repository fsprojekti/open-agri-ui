// file: src/context/DbProvider.jsx
import React, { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import { useTranslation } from "react-i18next";

import { DbContext } from "./DbContext.jsx";

import { fetchFarms } from "../api/farms.js";
import { fetchParcels } from "../api/parcels.js";
import { fetchCrops, fetchCropsObservationTypes } from "../api/crops.js";

// Apiaries & beehives
import {fetchApiaries, fetchApiaryObservationTypes} from "../api/apiary.js";
import { fetchBeehives } from "../api/beehive.js";

// Canonical crop species list with stable IDs and LATIN name
import cropSpeciesData from "../data/cropSpecies.json";

// Static actions list
import cropActions from "../data/cropActions.json";

// Static crop observation types list
import cropObservations from "../data/cropObserveTypes.json";

const toArray = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.results)) return data.results;
    if (Array.isArray(data?.data)) return data.data;
    return [];
};


// utils (top of DbProvider.jsx or a shared utils file)
const extractUuid = (id) => {
    const last = String(id || "").split(":").pop();
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(last)
        ? last
        : "";
};


export default function DbProvider({ children }) {
    const { i18n } = useTranslation();
    const lang = i18n.resolvedLanguage || i18n.language;

    /* ------------------------------- Auth & data ------------------------------- */
    const [user, setUser] = useState(null);

    const [farms, setFarms] = useState([]);
    const [parcels, setParcels] = useState([]);
    const [crops, setCrops] = useState([]);

    const [apiaries, setApiaries] = useState([]);
    const [apiaryObservationTypes, setApiaryObservationTypes] = useState([]);

    const [beehives, setBeehives] = useState([]);

    const [cropObservationTypes, setCropObservationTypes] = useState([]);

    /* ----------------------- Crop species (static) ----------------------- */
    const cropSpecies = useMemo(
        () =>
            (Array.isArray(cropSpeciesData) ? cropSpeciesData : [])
                .filter((s) => s && s.id && s.latin)
                .map((s) => ({
                    id: String(s.id),
                    latin: String(s.latin ?? ""),
                    variety: String(s.variety ?? ""),
                })),
        []
    );

    const cropSpeciesOptions = useMemo(() => {
        const tFixed = i18n.getFixedT(lang, "crops");
        const hasCropsBundle = i18n.hasResourceBundle(lang, "crops");
        return cropSpecies.map(({ id, latin, variety }) => {
            const localName = hasCropsBundle
                ? tFixed(`species.${id}`, { defaultValue: variety || latin })
                : variety || latin;
            return { value: id, label: `${localName} (${latin})`, latin, variety };
        });
    }, [i18n, lang, cropSpecies]);

    const findCropSpeciesByValue = (val) =>
        (val ? cropSpecies.find((s) => s.id === val) || null : null);

    /* ----------------------- Crop actions (static) ----------------------- */
    const prettifyKey = (k) =>
        String(k || "")
            .toLowerCase()
            .replace(/_/g, " ")
            .replace(/^\w/, (c) => c.toUpperCase());

    const cropActionOptions = useMemo(() => {
        const tFixed = i18n.getFixedT(lang, "actions");
        return (Array.isArray(cropActions) ? cropActions : []).map((key) => ({
            value: String(key),
            label: tFixed?.(key, { defaultValue: prettifyKey(key) }) ?? prettifyKey(key),
        }));
    }, [i18n, lang]);

    const findCropActionByValue = (val) =>
        (val ? cropActionOptions.find((a) => a.value === val) || null : null);

    /* -------------------- Crop observation types (from API) ------------------- */
    const cropObservationTypeOptions = useMemo(() => {
        const tFixed = i18n.getFixedT(lang, "observations");
        const pretty = (k) =>
            String(k || "")
                .toLowerCase()
                .replace(/_/g, " ")
                .replace(/^\w/, (c) => c.toUpperCase());

        // Normalize to { value, label }
        return (Array.isArray(cropObservationTypes) ? cropObservationTypes : []).map((item) => {
            // API might return plain strings or objects
            if (typeof item === "string") {
                const key = item;
                const fallback = pretty(key);
                return {
                    value: String(key),
                    label: tFixed?.(key, { defaultValue: fallback }) ?? fallback,
                };
            }

            const key = item?.value || item?.key || item?.id || "";
            const fallback = item?.label || pretty(key);

            return {
                value: String(key),
                label: tFixed?.(key, { defaultValue: fallback }) ?? fallback,
            };
        });
    }, [cropObservationTypes, i18n, lang]);

    const findCropObservationTypeByValue = (val) =>
        (val ? cropObservationTypeOptions.find((o) => o.value === val) || null : null);


    /* ------------------------------- Apiary observation types (from API) ------------------------------- */
    // const apiaryObservationTypeOptions = useMemo(() => {
    //     const tFixed = i18n.getFixedT(lang, "observations");
    // }





    /* -------------------------------- Fetchers ------------------------------- */
    async function refreshFarms() {
        try { setFarms(toArray(await fetchFarms())); }
        catch { setFarms([]); }
    }

    async function refreshParcels() {
        try { setParcels(toArray(await fetchParcels())); }
        catch { setParcels([]); }
    }

    async function refreshCrops() {
        try { setCrops(toArray(await fetchCrops())); }
        catch { setCrops([]); }
    }

    async function refreshApiaries() {
        try { setApiaries(toArray(await fetchApiaries())); }
        catch { setApiaries([]); }
    }

    async function refreshBeehives() {
        try { setBeehives(toArray(await fetchBeehives())); }
        catch { setBeehives([]); }
    }

    async function refreshCropObservationTypes() {
        try {
            const raw = toArray(await fetchCropsObservationTypes());

            // Pick the relevant FarmActivityType entry
            // (tweak this predicate if you have multiple)
            // Find the specific FarmActivityType for crop growth stage observations
            const activity =
                raw.find(
                    (a) =>
                        a.category === "observation" &&
                        a.name === "Crop Growth Stage Observation"
                ) || raw[0];

            if (!activity) {
                setCropObservationTypes([]);
                return;
            }

            // In your screenshot the field is "@id", not "id"
            const activityId = extractUuid(activity["@id"] || activity.id || "");

            // Map static observation codes -> objects linked to farmCalendarActivityId
            const types = cropObservations.map((obs) => ({
                value: String(obs),
                farmCalendarActivityId: activityId,
            }));

            setCropObservationTypes(types);
        } catch (error) {
            console.log(error);
            setCropObservationTypes([]);
        }
    }

    async function refreshApiaryObservationTypes(){
        try {
            const raw = toArray(await fetchApiaryObservationTypes());

            // Pick the relevant FarmActivityType entry
            // (tweak this predicate if you have multiple)
            // Find the specific FarmActivityType for crop growth stage observations
            const activity =
                raw.find(
                    (a) =>
                        a.category === "observation" &&
                        a.name === "Apiary Observation"
                ) || raw[0];

            if (!activity) {
                setApiaryObservationTypes([]);
                return;
            }

            // In your screenshot the field is "@id", not "id"
            const activityId = extractUuid(activity["@id"] || activity.id || "");

            // Map static observation codes -> objects linked to farmCalendarActivityId
            const types = cropObservations.map((obs) => ({
                value: String(obs),
                farmCalendarActivityId: activityId,
            }));

            setCropObservationTypes(types);
        } catch (error) {
            console.log(error);
            setCropObservationTypes([]);
        }

    }

    /* ----------------------- Hydrate + initial preloads ---------------------- */
    useEffect(() => {
        const token = Cookies.get("jwt");
        const email = Cookies.get("email");
        if (token && email) {
            setUser({ email, token });
            refreshFarms();
            refreshParcels();
            refreshCrops();
            refreshApiaries();
            refreshBeehives();
            refreshCropObservationTypes();
        }
    }, []);

    /* ------------------------- Auth event listeners -------------------------- */
    useEffect(() => {
        const onLogin = (e) => {
            const { token, email, claims } = e.detail || {};
            setUser({ email, token, claims });
            refreshFarms();
            refreshParcels();
            refreshCrops();
            refreshApiaries();
            refreshBeehives();
            refreshCropObservationTypes();
        };

        const onLogout = () => {
            setUser(null);
            setFarms([]);
            setParcels([]);
            setCrops([]);
            setApiaries([]);
            setBeehives([]);
            setCropObservationTypes([]);
        };

        window.addEventListener("auth:login", onLogin);
        window.addEventListener("auth:logout", onLogout);
        return () => {
            window.removeEventListener("auth:login", onLogin);
            window.removeEventListener("auth:logout", onLogout);
        };
    }, []);

    /* ------------------------------ Select lists ----------------------------- */
    const farmOptions = useMemo(
        () =>
            (farms || []).map((f) => {
                const id = f?.["@id"] || f?.id || "";
                const name =
                    f?.name ||
                    `${(f?.contactPerson?.firstname || "").trim()} ${(f?.contactPerson?.lastname || "").trim()}`.trim() ||
                    "Unnamed farm";
                return { value: id, label: name };
            }),
        [farms]
    );

    const parcelOptions = useMemo(
        () =>
            (parcels || []).map((p) => {
                const id = p?.["@id"] || p?.id || "";
                const label =
                    p?.identifier || `Parcel ${String(id).slice(-8)} — ${p?.area ?? "?"} ha`;
                return { value: id, label };
            }),
        [parcels]
    );

    const apiaryOptions = useMemo(
        () =>
            (apiaries || []).map((a) => {
                const id = a?.["@id"] || a?.id || "";
                const name =
                    a?.hasToponym ||
                    a?.identifier ||
                    `Apiary ${String(id).slice(-8)}`;
                return { value: id, label: name };
            }),
        [apiaries]
    );

    const beehiveOptions = useMemo(
        () =>
            (beehives || []).map((h) => {
                const id = h?.["@id"] || h?.id || "";
                const code =
                    h?.code ||
                    h?.identifier ||
                    `Hive ${String(id).slice(-8)}`;
                const model = h?.model ? ` — ${h.model}` : "";
                return { value: id, label: `${code}${model}` };
            }),
        [beehives]
    );

    /* --------------------------------- Value -------------------------------- */
    const value = {
        // auth
        user,
        setUser,

        // farms
        farms,
        setFarms,
        farmOptions,
        refreshFarms,

        // parcels
        parcels,
        setParcels,
        parcelOptions,
        refreshParcels,

        // crops
        crops,
        setCrops,
        refreshCrops,

        // crop species
        cropSpecies,
        cropSpeciesOptions,
        findCropSpeciesByValue,

        // crop actions
        cropActionOptions,
        findCropActionByValue,

        // crop observation types (from API + localized)
        cropObservationTypes,
        cropObservationTypeOptions,
        refreshCropObservationTypes,
        findCropObservationTypeByValue,

        // apiaries & beehives
        apiaries,
        setApiaries,
        apiaryOptions,
        refreshApiaries,
        beehives,
        setBeehives,
        beehiveOptions,
        refreshBeehives,
    };

    return <DbContext.Provider value={value}>{children}</DbContext.Provider>;
}


