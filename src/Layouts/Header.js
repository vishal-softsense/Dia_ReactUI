import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Dropdown, DropdownMenu, DropdownToggle, Form } from 'reactstrap';

//import images
import { APP_LOGO as logoSm } from "../Components/constants/brandLogo";

//import Components
import SearchOption from '../Components/Common/SearchOption';
import LanguageDropdown from '../Components/Common/LanguageDropdown';
import WebAppsDropdown from '../Components/Common/WebAppsDropdown';
import MyCartDropdown from '../Components/Common/MyCartDropdown';
import FullScreenDropdown from '../Components/Common/FullScreenDropdown';
import NotificationDropdown from '../Components/Common/NotificationDropdown';
import ProfileDropdown from '../Components/Common/ProfileDropdown';
import LightDark from '../Components/Common/LightDark';

import { changeSidebarVisibility, changeLeftsidebarSizeType } from '../slices/thunks';
import { useSelector, useDispatch } from "react-redux";
import { createSelector } from 'reselect';

const Header = ({ onChangeLayoutMode, layoutModeType, headerClass }) => {
    const dispatch = useDispatch();


    const selectDashboardData = createSelector(
        (state) => state.Layout,
        (state) => ({
            sidebarVisibilitytype: state.sidebarVisibilitytype})
      );
    // Inside your component
    const {sidebarVisibilitytype} = useSelector(selectDashboardData);
    

    const [search, setSearch] = useState(false);
    const toogleSearch = () => {
        setSearch(!search);
    };

    const toogleMenuBtn = () => {
        var windowSize = document.documentElement.clientWidth;
        dispatch(changeSidebarVisibility("show"));

        if (windowSize > 767)
            document.querySelector(".hamburger-icon").classList.toggle('open');

        //For collapse horizontal menu
        if (document.documentElement.getAttribute('data-layout') === "horizontal") {
            document.body.classList.contains("menu") ? document.body.classList.remove("menu") : document.body.classList.add("menu");
        }

        //For collapse vertical and semibox menu
        if (sidebarVisibilitytype === "show" && (document.documentElement.getAttribute('data-layout') === "vertical" || document.documentElement.getAttribute('data-layout') === "semibox")) {
            if (windowSize < 1025 && windowSize > 767) {
                document.body.classList.remove('vertical-sidebar-enable');
                // Persist collapsed (sm) vs open (lg) — empty attr maps to default lg
                const nextSize =
                    document.documentElement.getAttribute('data-sidebar-size') === 'sm' ? 'lg' : 'sm';
                document.documentElement.setAttribute('data-sidebar-size', nextSize === 'lg' ? '' : 'sm');
                dispatch(changeLeftsidebarSizeType(nextSize));
            } else if (windowSize > 1025) {
                document.body.classList.remove('vertical-sidebar-enable');
                const nextSize =
                    document.documentElement.getAttribute('data-sidebar-size') === 'lg' ? 'sm' : 'lg';
                document.documentElement.setAttribute('data-sidebar-size', nextSize);
                // Persist open/closed via existing Redux + localStorage (leftsidbarSizeType)
                dispatch(changeLeftsidebarSizeType(nextSize));
            } else if (windowSize <= 767) {
                // Mobile overlay only — do not overwrite desktop open/closed preference
                document.body.classList.add('vertical-sidebar-enable');
                document.documentElement.setAttribute('data-sidebar-size', 'lg');
            }
        }


        //Two column menu
        if (document.documentElement.getAttribute('data-layout') === "twocolumn") {
            document.body.classList.contains('twocolumn-panel') ? document.body.classList.remove('twocolumn-panel') : document.body.classList.add('twocolumn-panel');
        }
    };


    return (
        <React.Fragment>
            <header id="page-topbar" className={headerClass}>
                <div className="layout-width">
                    <div className="navbar-header">
                        <div className="d-flex">

                            <div className="navbar-brand-box horizontal-logo">
                                <Link to="/" className="logo logo-dark">
                                    <span className="logo-sm">
                                        <img src={logoSm} alt="DiaJewSoft" height="32" style={{ borderRadius: "10px" }} />
                                    </span>
                                    <span className="logo-lg">
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                                            <img src={logoSm} alt="DiaJewSoft" height="32" style={{ borderRadius: "10px" }} />
                                            <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.1 }}>
                                                <span style={{ fontSize: "1rem", fontWeight: 700 }}>DiaJewSoft</span>
                                                <span style={{ fontSize: "0.7rem", fontWeight: 500, opacity: 0.8 }}>SoftOnCloud</span>
                                            </span>
                                        </span>
                                    </span>
                                </Link>

                                <Link to="/" className="logo logo-light">
                                    <span className="logo-sm">
                                        <img src={logoSm} alt="DiaJewSoft" height="32" style={{ borderRadius: "10px" }} />
                                    </span>
                                    <span className="logo-lg">
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                                            <img src={logoSm} alt="DiaJewSoft" height="32" style={{ borderRadius: "10px" }} />
                                            <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.1 }}>
                                                <span style={{ color: "#fff", fontSize: "1rem", fontWeight: 700 }}>DiaJewSoft</span>
                                                <span style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.7rem", fontWeight: 500 }}>SoftOnCloud</span>
                                            </span>
                                        </span>
                                    </span>
                                </Link>
                            </div>

                            <button
                                onClick={toogleMenuBtn}
                                type="button"
                                className="btn btn-sm px-3 fs-16 header-item vertical-menu-btn topnav-hamburger"
                                id="topnav-hamburger-icon">
                                <span className="hamburger-icon">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </span>
                            </button>


                            <SearchOption />
                        </div>

                        <div className="d-flex align-items-center">

                            <Dropdown isOpen={search} toggle={toogleSearch} className="d-md-none topbar-head-dropdown header-item">
                                <DropdownToggle type="button" tag="button" className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle">
                                    <i className="bx bx-search fs-22"></i>
                                </DropdownToggle>
                                <DropdownMenu className="dropdown-menu-lg dropdown-menu-end p-0">
                                    <Form className="p-3">
                                        <div className="form-group m-0">
                                            <div className="input-group">
                                                <input type="text" className="form-control" placeholder="Search ..."
                                                    aria-label="Recipient's username" />
                                                <button className="btn btn-primary" type="submit"><i
                                                    className="mdi mdi-magnify"></i></button>
                                            </div>
                                        </div>
                                    </Form>
                                </DropdownMenu>
                            </Dropdown>

                            {/* LanguageDropdown */}
                            <LanguageDropdown />

                            {/* WebAppsDropdown */}
                            <WebAppsDropdown />

                            {/* MyCartDropdwon */}
                            <MyCartDropdown />

                            {/* FullScreenDropdown */}
                            <FullScreenDropdown />

                            {/* Dark/Light Mode set */}
                            <LightDark
                                layoutMode={layoutModeType}
                                onChangeLayoutMode={onChangeLayoutMode}
                            />

                            {/* NotificationDropdown */}
                            <NotificationDropdown />

                            {/* ProfileDropdown */}
                            <ProfileDropdown />
                        </div>
                    </div>
                </div>
            </header>
        </React.Fragment>
    );
};

export default Header;