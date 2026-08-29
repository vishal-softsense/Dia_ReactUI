import React, { useState, useEffect } from 'react';
import { Collapse, Container, NavbarToggler, NavLink } from 'reactstrap';
import { Link } from 'react-router-dom';
import Scrollspy from "react-scrollspy";


//import Images
import { APP_LOGO as logoSm } from "../../../Components/constants/brandLogo";

const Navbar = () => {
    const [navClass, setnavClass] = useState("");
    
    const [isOpenMenu, setisOpenMenu] = useState(false);
    const toggle = () => setisOpenMenu(!isOpenMenu);

    useEffect(() => {
        window.addEventListener("scroll", scrollNavigation, true);
    });

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
                target.classList.add('active');
                setActiveLink(target);
                if (activeLink && activeLink !== target) {
                    activeLink.classList.remove('active');
                }
            }
        };
        const defaultLink = document.querySelector('.navbar li.a.active');
        if (defaultLink) {
            defaultLink?.classList.add("active")
            setActiveLink(defaultLink)
        }
        const links = document.querySelectorAll('.navbar a');
        links.forEach((link) => {
            link.addEventListener('click', activation);
        });
        return () => {
            links.forEach((link) => {
                link.removeEventListener('click', activation);
            });
        };
    }, [activeLink]);

    var windowSize = document.documentElement.clientWidth;
    useEffect(() => {
        var navbar = document.getElementById("navbar");
        if (windowSize >= 992) {
            navbar.classList.add("navbar-light")
        }
        else {
            navbar.classList.remove("navbar-light")
        }
    }, [windowSize]);
    
    return (
        <React.Fragment>
            <nav className={"navbar navbar-expand-lg navbar-landing fixed-top " + navClass} id="navbar">
                <Container>
                    <Link className="navbar-brand" to="/index">
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                            <img src={logoSm} alt="DiaJewSoft" height="32" style={{ borderRadius: "8px" }} />
                            <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.1 }}>
                                <span style={{ fontSize: "1rem", fontWeight: 700 }}>DiaJewSoft</span>
                                <span style={{ fontSize: "0.7rem", fontWeight: 500, opacity: 0.75 }}>SoftOnCloud</span>
                            </span>
                        </span>
                    </Link>

                    <button className="navbar-toggler py-0 fs-20 text-body" onClick={toggle} type="button" data-bs-toggle="collapse"
                        data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent"
                        aria-expanded="false" aria-label="Toggle navigation">
                        <i className="mdi mdi-menu"></i>
                    </button>

                    <Collapse
                        className="navbar-collapse"
                        id="navbarSupportedContent"
                        isOpen={isOpenMenu}
                    >
                        <Scrollspy
                            offset={-18}
                            items={[
                                "hero",
                                "wallet",
                                "marketplace",
                                "categories",
                                "creators",
                            ]}
                            currentClassName="active"
                            className="navbar-nav mx-auto mt-2 mt-lg-0"
                            id="navbar-example"
                        >
                            <li className="nav-item">
                                <NavLink href="#hero">Home</NavLink>
                            </li>
                            <li className="nav-item">
                                <NavLink href="#wallet">Wallet</NavLink>
                            </li>
                            <li className="nav-item">
                                <NavLink href="#marketplace">Marketplace</NavLink>
                            </li>
                            <li className="nav-item">
                                <NavLink href="#categories">Categories</NavLink>
                            </li>
                            <li className="nav-item">
                                <NavLink href="#creators">Creators</NavLink>
                            </li>
                        </Scrollspy>

                        <div className="">
                            <Link to="/apps-nft-wallet" className="btn btn-success">Wallet Connect </Link>
                        </div>
                    </Collapse>
                </Container>
            </nav>
            <div className="bg-overlay bg-overlay-pattern"></div>
        </React.Fragment>
    );
};

export default Navbar;
