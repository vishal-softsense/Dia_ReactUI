import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Scrollspy from "react-scrollspy";
import {
  Collapse,
  Container,
  NavbarToggler,
  NavLink,
} from "reactstrap";
import { APP_LOGO as logoSm } from "../../../Components/constants/brandLogo";
const Navbar = () => {
  const [isOpenMenu, setisOpenMenu] = useState(false);
  const [navClass, setnavClass] = useState("");

  const toggle = () => setisOpenMenu(!isOpenMenu);

  useEffect(() => {
    window.addEventListener("scroll", scrollNavigation, true);
  });

  const scrollNavigation = () => {
    var scrollup = document.documentElement.scrollTop;
    if (scrollup > 50) {
      setnavClass(" is-sticky");
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

  return (
    <React.Fragment>
      <nav
        className={
          "navbar navbar-expand-lg navbar-landing fixed-top job-navbar" +
          navClass
        }
        id="navbar"
      >
        <Container fluid className="custom-container">
          <Link className="navbar-brand" to="/index">
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
              <img src={logoSm} alt="DiaJewSoft" height="32" style={{ borderRadius: "8px" }} />
              <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.1 }}>
                <span className="text-body fw-bold" style={{ fontSize: "1rem" }}>DiaJewSoft</span>
                <span className="text-muted" style={{ fontSize: "0.7rem", fontWeight: 500 }}>SoftOnCloud</span>
              </span>
            </span>
          </Link>
          <NavbarToggler
            onClick={toggle}
            className="navbar-toggler py-0 fs-20 text-body"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <i className="mdi mdi-menu"></i>
          </NavbarToggler>

          <Collapse className="navbar-collapse" id="navbarSupportedContent" isOpen={isOpenMenu}>
            <Scrollspy
              offset={-18}
              items={[
                "hero",
                "process",
                "categories",
                "findJob",
                "candidates",
                "blog",
              ]}
              currentClassName="active"
              className="navbar-nav mx-auto mt-2 mt-lg-0"
              id="navbar-example"
            >
              <li className="nav-item">
                <NavLink className="fs-16" href="#hero">
                  Home
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="fs-16" href="#process">
                  Process
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="fs-16" href="#categories">
                  Categories
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="fs-16" href="#findJob">
                  Find Jobs
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="fs-16" href="#candidates">
                  Candidates
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="fs-16" href="#blog">
                  Blog
                </NavLink>
              </li>
            </Scrollspy>

            <div>
              <Link to="/auth-signin-basic" className="btn btn-soft-primary">
                <i className="ri-user-3-line align-bottom me-1"></i> Login &
                Register
              </Link>
            </div>
          </Collapse>
        </Container>
      </nav>
    </React.Fragment>
  );
};

export default Navbar;
