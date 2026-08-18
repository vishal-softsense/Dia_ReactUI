import React from 'react';
import { Col, Container, Row } from 'reactstrap';

import diajewFeatures1 from "../../../assets/images/landing/features/diajew-features1.png";
import diajewFeatures2 from "../../../assets/images/landing/features/diajew-featues2.png";

const teamTypes = [
    { icon: "ri-admin-line", label: "Admins" },
    { icon: "ri-box-3-line", label: "Inventory Teams" },
    { icon: "ri-shopping-cart-2-line", label: "Purchase" },
    { icon: "ri-bill-line", label: "Sales" },
    { icon: "ri-wallet-3-line", label: "Accounts" },
    { icon: "ri-building-line", label: "Enterprises" },
];

const Features = () => {
    return (
        <React.Fragment>
            <section className="section bg-light py-5" id="features">
                <Container>
                    <Row className="align-items-center gy-4">
                        <Col lg={6} sm={7} className="mx-auto">
                            <div>
                                <img src={diajewFeatures1} alt="DiaJew SoftOnCloud Features" className="img-fluid mx-auto" />
                            </div>
                        </Col>
                        <Col lg={6}>
                            <div className="text-muted">
                                <h3 className="mb-4 fs-20 text-body">See Your Stock. Trade With Confidence.</h3>
                                <div className="vstack gap-3">
                                    {[
                                        "Real-time solitaire, jewellery, and parcel stock visibility",
                                        "Purchase, sales, and memo workflows in one system",
                                        "Grading masters for shape, color, clarity, lab & more",
                                        "Financial ledgers, outstanding, and summary reports",
                                        "Analytics dashboards for purchase, sale & stock trends",
                                    ].map((item) => (
                                        <div key={item} className="d-flex align-items-center">
                                            <div className="flex-shrink-0 me-2">
                                                <div className="avatar-xs">
                                                    <div className="avatar-title bg-success text-white rounded-circle">
                                                        <i className="ri-check-line"></i>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex-grow-1">
                                                <p className="mb-0 text-body ff-secondary">{item}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>

            <section className="section">
                <Container>
                    <Row className="align-items-center gy-4">
                        <Col lg={6} className="order-2 order-lg-1">
                            <div className="text-muted">
                                <h3 className="mb-4 fs-20 text-body">Built for Every Role</h3>

                                <Row className="g-3 mb-4">
                                    {teamTypes.map((team) => (
                                        <Col xs={6} sm={4} lg={6} xl={4} key={team.label}>
                                            <div className="text-center p-3 bg-light rounded">
                                                <div className="avatar-sm mx-auto mb-2">
                                                    <div className="avatar-title bg-white text-success rounded">
                                                        <i className={`${team.icon} fs-20`}></i>
                                                    </div>
                                                </div>
                                                <p className="mb-0 fw-medium text-body fs-14">{team.label}</p>
                                            </div>
                                        </Col>
                                    ))}
                                </Row>

                                <p className="mb-0 ff-secondary text-body">
                                    From admins and inventory teams to sales and accounts, DiaJew SoftOnCloud keeps everyone aligned with the right permissions and module access.
                                </p>
                            </div>
                        </Col>

                        <Col lg={6} sm={10} className="mx-auto order-1 order-lg-2">
                            <div>
                                <img src={diajewFeatures2} alt="Built for Every Role" className="img-fluid" />
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>
        </React.Fragment>
    );
};

export default Features;
