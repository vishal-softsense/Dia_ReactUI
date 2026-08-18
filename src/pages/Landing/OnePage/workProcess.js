import React from 'react';
import { Col, Container, Row } from 'reactstrap';

import processArrow from "../../../assets/images/landing/process-arrow-img.png";

const steps = [
    {
        step: "01",
        title: "Purchase",
        description: "Raise purchase orders, capture inward entries, and update solitaire, jewellery, or parcel stock.",
        icon: "ri-shopping-cart-2-line",
    },
    {
        step: "02",
        title: "Manage Stock",
        description: "Search inventory, grade diamonds, revise rates, and track memo or consignment movements.",
        icon: "ri-box-3-line",
    },
    {
        step: "03",
        title: "Sell & Account",
        description: "Invoice customers, record payments, and close books with ledgers, outstanding, and reports.",
        icon: "ri-line-chart-line",
    },
];

const WorkProcess = () => {
    return (
        <React.Fragment>
            <section className="section bg-light" id="how-it-works">
                <Container>
                    <Row className="justify-content-center">
                        <Col lg={8}>
                            <div className="text-center mb-5">
                                <h3 className="mb-3 fw-semibold">How It Works</h3>
                                <p className="text-muted mb-0 ff-secondary">
                                    Everything organized in 3 simple steps — Purchase → Manage Stock → Sell & Account
                                </p>
                            </div>
                        </Col>
                    </Row>

                    <Row className="text-center">
                        {steps.map((item, index) => (
                            <Col lg={4} key={item.title}>
                                <div className="process-card mt-4">
                                    {index < steps.length - 1 && (
                                        <div className="process-arrow-img d-none d-lg-block">
                                            <img src={processArrow} alt="" className="img-fluid" />
                                        </div>
                                    )}
                                    <div className="avatar-sm icon-effect mx-auto mb-4">
                                        <div className="avatar-title bg-transparent text-success rounded-circle h1">
                                            <i className={item.icon}></i>
                                        </div>
                                    </div>
                                    <p className="text-success fw-semibold mb-2">{item.step}</p>
                                    <h5>{item.title}</h5>
                                    <p className="text-muted ff-secondary mb-0">{item.description}</p>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </Container>
            </section>
        </React.Fragment>
    );
};

export default WorkProcess;
