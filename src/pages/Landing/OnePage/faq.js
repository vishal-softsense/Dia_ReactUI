import React, { useState } from 'react';
import { Col, Container, Row, Collapse } from 'reactstrap';
import classnames from "classnames";

const faqSections = [
    {
        icon: "ri-question-line",
        title: "General Questions",
        id: "general",
        items: [
            {
                question: "What is DiaJew SoftOnCloud?",
                answer: "DiaJew SoftOnCloud is a diamond and jewellery ERP that helps you manage inventory, purchase, sales, and accounts for solitaires, jewellery, and parcels in one place.",
            },
            {
                question: "Can I manage solitaires, jewellery, and parcels together?",
                answer: "Yes. Dedicated modules cover polished diamonds, jewellery mounting, and parcel/rough stock with shared purchase, sales, and accounts workflows.",
            },
            {
                question: "Does DiaJew support diamond grading masters?",
                answer: "Yes. Maintain shape, color, size, clarity, lab, polish, symmetry, fluorescence, and jewellery category, metal, and purity masters.",
            },
            {
                question: "Can I track memo and consignment stock?",
                answer: "Yes. Track memo, consignment, aging, lot assortment, and stock movements so inventory stays accurate.",
            },
            {
                question: "Is DiaJew available in multiple languages?",
                answer: "Yes. The app supports multiple languages and light/dark themes so teams can work in their preferred setup.",
            },
        ],
    },
    {
        icon: "ri-flow-chart",
        title: "Workflow & Operations",
        id: "workflow",
        items: [
            {
                question: "How does the purchase workflow work?",
                answer: "Create purchase orders, capture inward entries, and update stock with purchase analysis dashboards for suppliers and periods.",
            },
            {
                question: "Can I create sales invoices and memos?",
                answer: "Yes. Manage sales invoices, customer tracking, memo/sale reports, and monitor sales flow from dashboard analytics.",
            },
            {
                question: "Which inventory actions are supported?",
                answer: "Stock search, rate revise, consumption, kapan/lot handling, and real-time movement tracking across diamond and jewellery stock.",
            },
            {
                question: "Can different teams use different modules?",
                answer: "Yes. After login, users land on a welcome hub with Inventory, Purchase, Sales, and Accounts modules based on their access.",
            },
            {
                question: "Does DiaJew support multi-company login?",
                answer: "Yes. Sign in with Company ID, Username, and Password so each business unit stays separated securely.",
            },
        ],
    },
    {
        icon: "ri-file-chart-line",
        title: "Reports & Accounts",
        id: "reports",
        items: [
            {
                question: "Which financial reports are available?",
                answer: "Access ledgers, outstanding, brokerage/commission/loan, trial balance, P&L, balance sheet, invoice ledger, and cash flow reports.",
            },
            {
                question: "Can I analyze purchase and sales trends?",
                answer: "Yes. Purchase, sale, stock, and month analysis dashboards help you review performance across custom periods.",
            },
            {
                question: "Are stock register reports included?",
                answer: "Yes. Solitaire and parcel stock register reports, plus jewellery stock and movement reports, are available in the reporting suite.",
            },
            {
                question: "Can accounts and inventory stay in sync?",
                answer: "Yes. Inventory movements, sales, and payments feed into accounts so financial summaries stay aligned with stock activity.",
            },
        ],
    },
    {
        icon: "ri-shield-keyhole-line",
        title: "Security & Access",
        id: "security",
        items: [
            {
                question: "Does DiaJew support role-based access?",
                answer: "Yes. Menu-level permissions and role-based access control decide which modules and reports each user can open.",
            },
            {
                question: "How does user sign-in work?",
                answer: "Users sign in securely with company credentials. Admins can control registration and access as needed.",
            },
            {
                question: "Is my business data secure?",
                answer: "DiaJew SoftOnCloud is built with security and privacy in mind, including account controls, permissions, and session management.",
            },
            {
                question: "Can I use DiaJew from anywhere?",
                answer: "Yes. Access your inventory, sales, and accounts from any modern browser with your SoftOnCloud credentials.",
            },
        ],
    },
];

const FaqAccordion = ({ sectionId, items }) => {
    const [openIndex, setOpenIndex] = useState(-1);

    const toggle = (index) => {
        setOpenIndex(openIndex === index ? -1 : index);
    };

    return (
        <div
            className="accordion custom-accordionwithicon custom-accordion-border accordion-border-box"
            id={`${sectionId}-accordion`}
        >
            {items.map((item, index) => (
                <div className="accordion-item" key={item.question}>
                    <h2 className="accordion-header" id={`${sectionId}-heading-${index}`}>
                        <button
                            className={classnames("accordion-button", "fw-medium", {
                                collapsed: openIndex !== index,
                            })}
                            type="button"
                            onClick={() => toggle(index)}
                            style={{ cursor: "pointer" }}
                        >
                            {item.question}
                        </button>
                    </h2>
                    <Collapse isOpen={openIndex === index} className="accordion-collapse">
                        <div className="accordion-body ff-secondary">{item.answer}</div>
                    </Collapse>
                </div>
            ))}
        </div>
    );
};

const Faqs = () => {
    return (
        <React.Fragment>
            <section className="section" id="faqs">
                <Container>
                    <Row className="justify-content-center">
                        <Col lg={8}>
                            <div className="text-center mb-5">
                                <h3 className="mb-3 fw-semibold">Frequently Asked Questions</h3>
                                <p className="text-muted mb-4 ff-secondary">
                                    If you can not find answer to your question in our FAQ, you can
                                    always contact us or email us. We will answer you shortly!
                                </p>

                                <div className="hstack flex-wrap gap-2 justify-content-center">
                                    <a
                                        href="mailto:noreply@softoncloud.com"
                                        className="btn btn-success rounded-pill"
                                    >
                                        <i className="ri-mail-line align-middle me-2"></i>
                                        Email Us
                                    </a>
                                </div>
                            </div>
                        </Col>
                    </Row>

                    <Row className="g-lg-5 g-4">
                        {faqSections.map((section) => (
                            <Col lg={6} key={section.id}>
                                <div className="d-flex align-items-center mb-2">
                                    <div className="flex-shrink-0 me-1">
                                        <i className={`${section.icon} fs-24 align-middle text-success me-1`}></i>
                                    </div>
                                    <div className="flex-grow-1">
                                        <h5 className="mb-0 fw-semibold">{section.title}</h5>
                                    </div>
                                </div>
                                <FaqAccordion sectionId={section.id} items={section.items} />
                            </Col>
                        ))}
                    </Row>
                </Container>
            </section>
        </React.Fragment>
    );
};

export default Faqs;
