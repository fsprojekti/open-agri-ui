// src/api/farms.js
import Cookies from 'js-cookie';
import { SERVICES } from '../config.js';

// With your proxy: '/farmcalendar' -> http://209.38.211.183:8002/api
const BASE = SERVICES.farmCalendar.baseURL || '/farmcalendar';

export async function fetchFarms() {
    const token = Cookies.get('jwt');
    if (!token) throw new Error('Not authenticated');

    const res = await fetch(`${BASE}/v1/Farm/`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        const msg = await res.text().catch(() => '');
        throw new Error(`Failed to fetch farms (${res.status}) ${msg}`);
    }

    return res.json();
}

export async function addFarm(farmData) {
    const token = Cookies.get('jwt');
    if (!token) throw new Error('Not authenticated');

    const c = farmData?.contact || {};
    const a = farmData?.address || {};

    const firstName = (c.firstName || '').trim();
    const lastName  = (c.lastName  || '').trim();

    const country     = (a.country     || '').trim();
    const city        = (a.city        || '').trim();
    const street      = (a.street      || '').trim();
    const houseNumber = (a.houseNumber || '').trim();

    const contactFull = [firstName, lastName].filter(Boolean).join(' ').trim();
    const line1 = [street, houseNumber].filter(Boolean).join(' ').trim();
    const fullAddress = [line1, city, country].filter(Boolean).join(', ');

    const nonEmpty = (val, ...fallbacks) =>
        [val, ...fallbacks]
            .map(v => (v ?? ''))
            .map(v => v.toString().trim())
            .find(v => v.length > 0) || 'N/A';

    const payload = {
        status: 1,
        name: contactFull,
        //Put email here even though it's not in the model
        description: nonEmpty(fullAddress, 'No description provided'),
        administrator: nonEmpty(farmData.contact.email, 'NA'),
        telephone: nonEmpty(farmData.contact.phone, '000000000'),
        vatID: 'NA',

        contactPerson: {
            firstname: nonEmpty(firstName, 'Unknown'),
            lastname:  nonEmpty(lastName,  'Unknown'),
        },

        address: {
            adminUnitL1: country,
            adminUnitL2: city,
            addressArea: street + (houseNumber ? ` ${houseNumber}` : ''),
            municipality: 'NA',
            community: 'NA',
            locatorName: 'NA',
        },
    };

    const res = await fetch(`${BASE}/v1/Farm/`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    console.log(res)

    if (!res.ok) {
        let msg = '';
        try { msg = JSON.stringify(await res.json()); }
        catch { msg = await res.text().catch(() => ''); }
        throw new Error(`Failed to add farm (${res.status}) ${msg}`);
    }

    return res.json();
}


