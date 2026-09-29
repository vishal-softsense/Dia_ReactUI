import React, { useState, useEffect } from "react";
import { Collapse, Container, NavbarToggler, NavLink } from "reactstrap";
import Scrollspy from "react-scrollspy";
import { Link } from "react-router-dom";

import { APP_LOGO as logoSm, APP_LOGO_ALT as logoAlt } from "../../../Components/constants/brandLogo";

const Navbar = () => {
    const [isOpenMenu, setisOpenMenu] = useState(false);
    const [navClass, setnavClass] = useState("");

    const toggle = () => setisOpenMenu(!isOpenMenu);
    const closeMenu = () => setisOpenMenu(false);

    useEffect(() => {
        window.addEventListener("scroll", scrollNavigation, true);
        return () => {
            window.removeEventListener("scroll", scrollNavigation, true);
        };
    }, []);

    const scrollNavigation = () => {
        var scrollup = document.documentElement.scrollTop;
        if (scrollup > 50) {
            setnavClass("is-sticky");
        } else {
            setnavClass("");
        }
    };

    const [activeLink, setActiveLink] = useState();
    useEffect(() => {
        const activation = (event) => {
            const target = event.target;
            if (target) {
                target.classList.add("active");
                setActiveLink(target);
                if (activeLink && activeLink !== target) {
                    activeLink.classList.remove("active");
                }
            }
        };
        const defaultLink = document.querySelector(".navbar li.a.active");
        if (defaultLink) {
            defaultLink?.classList.add("active");
            setActiveLink(defaultLink);
        }
        const links = document.querySelectorAll(".navbar a");
        links.forEach((link) => {
            link.addEventListener("click", activation);
        });
        return () => {
            links.forEach((link) => {
                link.removeEventListener("click", activation);
            });
        };
    }, [activeLink]);

    return (
        <React.Fragment>
            <nav className={"navbar navbar-expand-lg navbar-landing fixed-top " + navClass} id="navbar">
                <Container>
                    <Link className="navbar-brand landing-brand" to="/">
                        <span className="brand-logo-expanded">
                            <img src={logoSm} alt={logoAlt} className="brand-logo-icon" width="36" height="36" style={{ borderRadius: "12px" }} />
                            <span className="brand-logo-text">
                                <span className="brand-logo-title">DiaJewSoft</span>
                                <span className="brand-logo-subtitle">SoftOnCloud</span>
                            </span>
                        </span>
                    </Link>

                    <NavbarToggler
                        className="navbar-toggler py-0 fs-20"
                        onClick={toggle}
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#navbarSupportedContent"
                        aria-controls="navbarSupportedContent"
                        aria-expanded="false"
                        aria-label="Toggle navigation"
                    >
                        <i className="mdi mdi-menu"></i>
                    </NavbarToggler>

                    <Collapse
                        isOpen={isOpenMenu}
                        className="navbar-collapse"
                        id="navbarSupportedContent"
                    >
                        <Scrollspy
                            offset={-18}
                            items={[
                                "hero",
                                "services",
                                "features",
                                "faqs",
                                "pricing",
                                "contact",
                            ]}
                            currentClassName="active"
                            className="navbar-nav mx-auto mt-2 mt-lg-0"
                            id="navbar-example"
                        >
                            <li className="nav-item">
                                <NavLink href="/#hero" onClick={closeMenu}>Home</NavLink>
                            </li>
                            <li className="nav-item">
                                <NavLink href="/#services" onClick={closeMenu}>Services</NavLink>
                            </li>
                            <li className="nav-item">
                                <NavLink href="/#features" onClick={closeMenu}>Features</NavLink>
                            </li>
                            <li className="nav-item">
                                <NavLink href="/#faqs" onClick={closeMenu}>FAQ</NavLink>
                            </li>
                            <li className="nav-item">
                                <NavLink href="/#pricing" onClick={closeMenu}>Pricing</NavLink>
                            </li>
                            <li className="nav-item">
                                <NavLink href="/#contact" onClick={closeMenu}>Contact</NavLink>
                            </li>
                        </Scrollspy>

                        <div className="d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center gap-2 ms-lg-auto navbar-landing-actions">
                            <Link to="/login" className="btn btn-link fw-medium text-decoration-none" onClick={closeMenu}>
                                Sign in
                            </Link>
                            <a
                                href="https://softoncloud.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-light"
                                onClick={closeMenu}
                            >
                                Sign Up
                            </a>
                        </div>
                    </Collapse>
                </Container>
            </nav>
        </React.Fragment>
    );
};

export default Navbar;
