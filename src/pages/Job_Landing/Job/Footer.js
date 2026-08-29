import React from "react";
import { Link } from "react-router-dom";
import { Col, Container, Row } from "reactstrap";
import { APP_LOGO as logoSm } from "../../../Components/constants/brandLogo";

const Footer = () => {
  return (
    <React.Fragment>
      <footer className="custom-footer bg-dark py-5 position-relative">
        <Container>
          <Row>
            <Col className="col-lg-4 mt-4">
              <div>
                <div>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.55rem" }}>
                    <img src={logoSm} alt="DiaJewSoft" height="32" style={{ borderRadius: "8px" }} />
                    <span style={{ display: "inline-flex", flexDirection: "column", lineHeight: 1.1 }}>
                      <span style={{ color: "#fff", fontSize: "1.05rem", fontWeight: 700 }}>DiaJewSoft</span>
                      <span style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.72rem", fontWeight: 500 }}>SoftOnCloud</span>
                    </span>
                  </span>
                </div>
                <div className="mt-4 fs-13">
                  <p>Premium Multipurpose Admin & Dashboard Template</p>
                  <p>
                    You can build any type of web application like eCommerce,
                    CRM, CMS, Project management apps, Admin Panels, etc using
                    Velzon.
                  </p>
                  <ul className="list-inline mb-0 footer-social-link">
                    <li className="list-inline-item">
                      <Link to="#!" className="avatar-xs d-block">
                        <div className="avatar-title rounded-circle">
                          <i className="ri-facebook-fill"></i>
                        </div>
                      </Link>
                    </li>
                    <li className="list-inline-item">
                      <Link to="#!" className="avatar-xs d-block">
                        <div className="avatar-title rounded-circle">
                          <i className="ri-github-fill"></i>
                        </div>
                      </Link>
                    </li>
                    <li className="list-inline-item">
                      <Link to="#!" className="avatar-xs d-block">
                        <div className="avatar-title rounded-circle">
                          <i className="ri-linkedin-fill"></i>
                        </div>
                      </Link>
                    </li>
                    <li className="list-inline-item">
                      <Link to="#!" className="avatar-xs d-block">
                        <div className="avatar-title rounded-circle">
                          <i className="ri-google-fill"></i>
                        </div>
                      </Link>
                    </li>
                    <li className="list-inline-item">
                      <Link to="#!" className="avatar-xs d-block">
                        <div className="avatar-title rounded-circle">
                          <i className="ri-dribbble-line"></i>
                        </div>
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </Col>

            <Col className="col-lg-7 ms-lg-auto">
              <Row>
                <Col className="col-sm-4 mt-4">
                  <h5 className="text-white mb-0">Company</h5>
                  <div className="text-muted mt-3">
                    <ul className="list-unstyled ff-secondary footer-list fs-16">
                      <li>
                        <Link to="/pages-profile">About Us</Link>
                      </li>
                      <li>
                        <Link to="/pages-gallery">Gallery</Link>
                      </li>
                      <li>
                        <Link to="/pages-team">Team</Link>
                      </li>
                      <li>
                        <Link to="/pages-pricing">Pricing</Link>
                      </li>
                      <li>
                        <Link to="/pages-timeline">Timeline</Link>
                      </li>
                    </ul>
                  </div>
                </Col>
                <Col className="col-sm-4 mt-4">
                  <h5 className="text-white mb-0">For Jobs</h5>
                  <div className="text-muted mt-3">
                    <ul className="list-unstyled ff-secondary footer-list fs-16">
                      <li>
                        <Link to="/apps-job-lists">Job List</Link>
                      </li>
                      <li>
                        <Link to="/apps-job-application">
                          application
                        </Link>
                      </li>
                      <li>
                        <Link to="/apps-job-new">New Job</Link>
                      </li>
                      <li>
                        <Link to="/apps-job-companies-lists">
                          Company List
                        </Link>
                      </li>
                    </ul>
                  </div>
                </Col>
                <Col className="col-sm-4 mt-4">
                  <h5 className="text-white mb-0">Support</h5>
                  <div className="text-muted mt-3">
                    <ul className="list-unstyled ff-secondary footer-list fs-16">
                      <li>
                        <Link to="/pages-faqs">FAQ</Link>
                      </li>
                      <li>
                        <Link to="/pages-faqs">Contact</Link>
                      </li>
                    </ul>
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>

          <Row className="text-center text-sm-start align-items-center mt-5">
            <Col className="col-sm-6">
              <div>
                <p className="copy-rights mb-0">
                  {new Date().getFullYear()} ©
                  Velzon - Themesbrand
                </p>
              </div>
            </Col>
            <Col className="col-sm-6">
              <div className="text-sm-end mt-3 mt-sm-0">
                <ul className="list-inline mb-0 footer-list gap-4 fs-15">
                  <li className="list-inline-item">
                    <Link to="/pages-privacy-policy">Privacy Policy</Link>
                  </li>
                  <li className="list-inline-item">
                    <Link to="/pages-term-conditions">
                      Terms & Conditions
                    </Link>
                  </li>
                  <li className="list-inline-item">
                    <Link to="/pages-privacy-policy">Security</Link>
                  </li>
                </ul>
              </div>
            </Col>
          </Row>
        </Container>
      </footer>
    </React.Fragment>
  );
};

export default Footer;
