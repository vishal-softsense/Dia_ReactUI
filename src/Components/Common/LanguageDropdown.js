import React, { useEffect, useState } from 'react';
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'reactstrap';
import { get } from "lodash";

//i18n
import i18n from "../../i18n";
import languages from "../../common/languages";


// RTL languages that require right-to-left document direction
const RTL_LANGUAGES = ['ar', 'hb'];

const applyDirection = (lang) => {
    const isRTL = RTL_LANGUAGES.includes(lang);
    const dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    if (isRTL) {
        document.body.classList.add('rtl');
    } else {
        document.body.classList.remove('rtl');
    }
};

const LanguageDropdown = () => {
    const [selectedLang, setSelectedLang] = useState("en");

    useEffect(() => {
        // On mount: restore language from sessionStorage → localStorage → default 'en'
        const savedLang =
            sessionStorage.getItem('languages') ||
            localStorage.getItem('I18N_LANGUAGE') ||
            'en';
        const validLang = languages[savedLang] ? savedLang : 'en';
        setSelectedLang(validLang);
        i18n.changeLanguage(validLang);
        applyDirection(validLang);
    }, []);

    const changeLanguageAction = (lang) => {
        i18n.changeLanguage(lang);
        // Persist in both stores to match jQuery behaviour
        sessionStorage.setItem('languages', lang);
        localStorage.setItem('I18N_LANGUAGE', lang);
        setSelectedLang(lang);
        applyDirection(lang);
    };

    const [isLanguageDropdown, setIsLanguageDropdown] = useState(false);
    const toggleLanguageDropdown = () => {
        setIsLanguageDropdown(!isLanguageDropdown);
    };

    return (
        <React.Fragment>
            <Dropdown isOpen={isLanguageDropdown} toggle={toggleLanguageDropdown} className="ms-1 topbar-head-dropdown header-item">
                <DropdownToggle className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle" tag="button">
                    <img
                        src={get(languages, `${selectedLang}.flag`)}
                        alt="Header Language"
                        height="20"
                        className="rounded"
                    />
                </DropdownToggle>
                <DropdownMenu className="notify-item language py-2">
                    {Object.keys(languages).map(key => (
                        <DropdownItem
                            key={key}
                            onClick={() => changeLanguageAction(key)}
                            className={`notify-item ${selectedLang === key ? "active" : "none"}`}
                        >
                            <img
                                src={get(languages, `${key}.flag`)}
                                alt={get(languages, `${key}.label`)}
                                className="me-2 rounded"
                                height="18"
                            />
                            <span className="align-middle">
                                {get(languages, `${key}.label`)}
                            </span>
                        </DropdownItem>
                    ))}
                </DropdownMenu>
            </Dropdown>
        </React.Fragment>
    );
};

export default LanguageDropdown;