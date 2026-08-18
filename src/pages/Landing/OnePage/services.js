import React from 'react';
import { Col, Container, Row } from 'reactstrap';

const serviceItems = [
    {
        icon: "ri-copper-diamond-line",
        title: "Solitaire Inventory",
        description: "Track polished diamonds with stock search, memo, consignment, aging, lot assortment, and rate revise.",
    },
    {
        icon: "ri-vip-diamond-line",
        title: "Jewellery Management",
        description: "Manage jewellery stock, mounting, purchase, sale, and memo reports across metal and purity masters.",
    },
    {
        icon: "ri-box-3-line",
        title: "Parcel & Rough",
        description: "Handle parcel item masters, parcel dashboards, and rough analysis with clear stock visibility.",
    },
    {
        icon: "ri-shopping-cart-2-line",
        title: "Purchase Control",
        description: "Manage suppliers, purchase orders, and inward entries with full purchase analysis dashboards.",
    },
    {
        icon: "ri-bill-line",
        title: "Sales & Invoicing",
        description: "Create invoices, track customers, and monitor sales flow from memo to final billing.",
    },
    {
        icon: "ri-wallet-3-line",
        title: "Accounts & Finance",
        description: "Ledgers, payments, receipts, outstanding, brokerage, trial balance, P&L, and balance sheet.",
    },
    {
        icon: "ri-list-settings-line",
        title: "Masters & Grading",
        description: "Maintain shape, color, clarity, lab, polish, symmetry, FL, category, metal, and purity masters.",
    },
    {
        icon: "ri-bar-chart-box-line",
        title: "Analytics & Reports",
        description: "Purchase, sale, stock, and month analysis dashboards with role-based reporting access.",
    },
];

const Services = () => {
    return (
        <React.Fragment>
            <section className="section" id="services">
                <Container>
                    <Row className="justify-content-center">
                        <Col lg={8}>
                            <div className="text-center mb-5">
                                <h5 className="fs-12 text-uppercase text-success mb-2">Powerful Features</h5>
                                <h3 className="mb-3 fw-semibold">Everything You Need for Diamond & Jewellery Business</h3>
                                <p className="text-muted mb-0 ff-secondary">
                                    Inventory, purchase, sales, and accounts — purpose-built for DiaJew SoftOnCloud.
                                </p>
                            </div>
                        </Col>
                    </Row>

                    <Row className="g-3">
                        {serviceItems.map((item) => (
                            <Col lg={3} md={6} key={item.title}>
                                <div className="d-flex p-3">
                                    <div className="flex-shrink-0 me-3">
                                        <div className="avatar-sm icon-effect">
                                            <div className="avatar-title bg-transparent text-success rounded-circle">
                                                <i className={`${item.icon} fs-36`}></i>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-grow-1">
                                        <h5 className="fs-18">{item.title}</h5>
                                        <p className="text-muted mb-0 ff-secondary">{item.description}</p>
                                    </div>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </Container>
            </section>
        </React.Fragment>
    );
};

export default Services;
