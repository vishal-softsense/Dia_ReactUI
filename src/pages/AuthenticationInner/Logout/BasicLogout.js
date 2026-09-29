import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody, Col, Container, Row } from 'reactstrap';
import ParticlesAuth from "../ParticlesAuth";

//import images
import { APP_LOGO as logoSm } from "../../../Components/constants/brandLogo";

const BasicLogout = () => {
    document.title = "Log Out | DiaJewel - Diamond & Jewellery Cloud Business App";
    return (
        <React.Fragment>
            <ParticlesAuth>
                <div className="auth-page-content mt-lg-5">
                    <Container>
                        <Row>
                            <Col lg={12}>
                                <div className="text-center mt-sm-5 mb-4 text-white-50">
                                    <div>
                                        <Link to="/dashboard" className="d-inline-block auth-logo">
                                            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem" }}>
                                                <img src={logoSm} alt="DiaJewSoft" height="28" style={{ borderRadius: "8px" }} />
                                                <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.1, textAlign: "left" }}>
                                                    <span style={{ color: "#fff", fontSize: "1rem", fontWeight: 700 }}>DiaJewSoft</span>
                                                    <span style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.65rem", fontWeight: 500 }}>SoftOnCloud</span>
                                                </span>
                                            </span>
                                        </Link>
                                    </div>
                                    <p className="mt-3 fs-15 fw-medium">Premium Admin & Dashboard Template</p>
                                </div>
                            </Col>
                        </Row>

                        <Row className="justify-content-center">
                            <Col md={8} lg={6} xl={5}>
                                <Card className="mt-4">
                                    <CardBody className="p-4 text-center">
                                        <lord-icon
                                            src="https://cdn.lordicon.com/hzomhqxz.json"
                                            trigger="loop"
                                            colors="primary:#405189,secondary:#08a88a"
                                            style={{ width: "180px", height: "180px" }}>
                                        </lord-icon>

                                        <div className="mt-4 pt-2">
                                            <h5>You are Logged Out</h5>
                                            <p className="text-muted">Thank you for using <span className="fw-semibold">velzon</span> admin template</p>
                                            <div className="mt-4">
                                                <Link to="/auth-signin-basic" className="btn btn-success w-100">Sign In</Link>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>
                    </Container>
                </div>
            </ParticlesAuth>
        </React.Fragment >
    );
};

export default BasicLogout;