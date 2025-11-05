// src/config.js

// ───────────────────────────────────────────────────────────
// ▸ External service endpoints with credentials
// Each service can define its own baseURL, timeout, and auth info
export const SERVICES = {
    gatekeeper: {
        baseURL: '/gatekeeper',
        timeout: 15000,
        credentials: {
            username: 'admin',
            password: 'scibeesuperuserpass'
        },
        accessCode:"1234"
    },
    farmCalendar: {
        baseURL: '/farmcalendar',
        timeout: 15000,
    },
    weather: {
        baseURL: 'https://api.weatherprovider.com/v2',
        timeout: 20000,
        credentials: {
            clientId: 'weather-client-id',
            clientSecret: 'weather-client-secret'
        }
    }
    // add more services as needed
};

export const SERVICE_NAME = 'farm_calendar';

