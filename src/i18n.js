import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Cookies from 'js-cookie';

// Default / common UI strings
import enCommon from './locales/en/translation.json';
import slCommon from './locales/sl/translation.json';

// Crop species (LOCAL/common names only; Latin is appended in UI)
import enCrops from './locales/en/crops.json';
import slCrops from './locales/sl/crops.json';

const savedLang = Cookies.get('language') || 'en';

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: {
                translation: enCommon, // default namespace = "translation"
                crops: enCrops,        // extra namespace
            },
            sl: {
                translation: slCommon,
                crops: slCrops,
            },
        },
        lng: savedLang,
        fallbackLng: 'en',
        supportedLngs: ['en', 'sl'],
        // If you ever use "sl-SI", this maps it to "sl"
        load: 'languageOnly',
        nonExplicitSupportedLngs: true,

        ns: ['translation', 'crops'],  // tell i18n the namespaces you use
        defaultNS: 'translation',
        interpolation: { escapeValue: false },
        react: { useSuspense: false },
    });

// Persist language to cookie on change
i18n.on('languageChanged', (lng) => {
    Cookies.set('language', lng, { path: '/', expires: 365 });
});

export default i18n;
