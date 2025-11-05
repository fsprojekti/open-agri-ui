// src/components/LanguageSwitcher.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { NavDropdown } from 'react-bootstrap';
import ReactCountryFlag from 'react-country-flag';
import Cookies from 'js-cookie';

const LANGUAGES = {
    en: 'US',
    sl: 'SI'
};

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();
    const current = i18n.language;

    const changeLanguage = (lng) => {
        if (lng !== current) {
            i18n.changeLanguage(lng);
            Cookies.set('language', lng, { expires: 365, path: '/' });
        }
    };

    const currentCountry = LANGUAGES[current] || current.toUpperCase();

    return (
        <NavDropdown
            title={
                <span className="d-inline-flex align-items-center">
          <ReactCountryFlag
              countryCode={currentCountry}
              svg
              style={{ width: '1.5em', height: '1em', marginRight: '0.5em' }}
              title={currentCountry}
          />
                    {current.toUpperCase()}
        </span>
            }
            id="lang-switcher"
            align="end"
        >
            {Object.entries(LANGUAGES).map(([code, countryCode]) => (
                <NavDropdown.Item
                    key={code}
                    active={code === current}
                    onClick={() => changeLanguage(code)}
                    className="d-inline-flex align-items-center"
                >
                    <ReactCountryFlag
                        countryCode={countryCode}
                        svg
                        style={{ width: '1.5em', height: '1em', marginRight: '0.5em' }}
                        title={countryCode}
                    />
                    {code.toUpperCase()}
                </NavDropdown.Item>
            ))}
        </NavDropdown>
    );
}
