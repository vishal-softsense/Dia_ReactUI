import React, { useEffect, useState } from 'react';
import { Col, Container, Row } from 'reactstrap';

import imgpattern from "../../../assets/images/landing/img-pattern.png";
import diajewHero1 from "../../../assets/images/landing/features/diajew-hero1.png";
import diajewHero2 from "../../../assets/images/landing/features/diajew-hero2.png";

const HERO_SLIDE_INTERVAL = 5000;

const heroImages = [
    {
        id: "hero-1",
        image: diajewHero1,
        imageAlt: "DiaJew SoftOnCloud Inventory & Stock",
    },
    {
        id: "hero-2",
        image: diajewHero2,
        imageAlt: "DiaJew SoftOnCloud Sales & Accounts",
    },
];

const heroContent = {
    badge: "Diamond & Jewellery ERP",
    titleLines: [
        { text: "Track Inventory.", accent: false },
        { text: "Sell Smarter.", accent: true },
        { text: "Close Accounts Faster.", accent: false },
    ],
    description:
        "DiaJew SoftOnCloud helps you manage solitaires, jewellery, parcels, purchases, sales, and accounts — with real-time stock, grading masters, and analytics in one platform.",
    features: [
        "Solitaire, Jewellery & Parcel Inventory",
        "Purchase Orders & Inward Entries",
        "Sales, Memos & Customer Invoicing",
        "Ledgers, Payments & Financial Summaries",
        "Diamond Grading & Jewellery Masters",
        "Dashboards, Analytics & Role-Based Access",
    ],
};

const heroHighlights = [
    { icon: "ri-shield-check-line", label: "Secure & Role-Based" },
    { icon: "ri-refresh-line", label: "Real-Time Stock" },
    { icon: "ri-copper-diamond-line", label: "Built for Jewellers" },
    { icon: "ri-global-line", label: "Access Anywhere" },
];

const Home = () => {
    const [activeSlide, setActiveSlide] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setActiveSlide((prev) => (prev + 1) % heroImages.length);
        }, HERO_SLIDE_INTERVAL);

        return () => clearInterval(timer);
    }, []);

    return (
        <React.Fragment>
            <section className="section pb-0 hero-section" id="hero">
                <div className="bg-overlay bg-overlay-pattern"></div>
                <Container fluid className="hero-container px-3 px-lg-4 px-xl-5">
                    <Row className="align-items-center hero-content-row g-4 g-lg-4">
                        <Col lg={4} className="order-2 order-lg-1">
                            <div className="hero-copy text-center text-lg-start">
                                <span className="badge bg-success-subtle text-success mb-3 fs-12 text-uppercase">
                                    {heroContent.badge}
                                </span>

                                <h1 className="display-6 fw-semibold mb-3 lh-base">
                                    {heroContent.titleLines.map((line) => (
                                        <React.Fragment key={line.text}>
                                            {line.accent ? (
                                                <span className="text-success hero-title-accent">{line.text}</span>
                                            ) : (
                                                line.text
                                            )}
                                            <br />
                                        </React.Fragment>
                                    ))}
                                </h1>

                                <p className="lead text-muted lh-base mb-4">{heroContent.description}</p>

                                <ul className="list-unstyled hero-feature-list text-start d-inline-block mb-0">
                                    {heroContent.features.map((feature) => (
                                        <li key={feature} className="d-flex align-items-center gap-2 mb-2">
                                            <span className="avatar-xs flex-shrink-0">
                                                <span className="avatar-title rounded-circle bg-success-subtle text-success">
                                                    <i className="ri-check-line"></i>
                                                </span>
                                            </span>
                                            <span className="fw-medium text-body">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="d-flex flex-wrap gap-2 justify-content-center justify-content-lg-start mb-4 mt-4">
                                    <a
                                        href="https://softoncloud.com/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-success"
                                    >
                                        Start Free Trial
                                    </a>
                                    <a href="https://softoncloud.com/" target="_blank" rel="noopener noreferrer" className="btn btn-soft-success">
                                        Explore All Apps <i className="ri-arrow-right-line align-middle ms-1"></i>
                                    </a>
                                </div>

                                <div className="hero-trust-row justify-content-center justify-content-lg-start mb-3">
                                    {heroHighlights.map((item) => (
                                        <div key={item.label} className="hero-trust-item text-center text-lg-start">
                                            <div className="avatar-xs mx-auto mx-lg-0 mb-1">
                                                <span className="avatar-title rounded-circle bg-light text-success">
                                                    <i className={item.icon}></i>
                                                </span>
                                            </div>
                                            <div className="fs-12 text-muted fw-medium">{item.label}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="hero-slide-indicators d-flex justify-content-center justify-content-lg-start gap-2">
                                    {heroImages.map((slide, index) => (
                                        <button
                                            key={slide.id}
                                            type="button"
                                            className={`hero-slide-dot${index === activeSlide ? " is-active" : ""}`}
                                            aria-label={`Show hero image ${index + 1}`}
                                            aria-current={index === activeSlide ? "true" : undefined}
                                            onClick={() => setActiveSlide(index)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </Col>
                        <Col lg={8} className="order-1 order-lg-2">
                            <div className="demo-carousel hero-slides-visual position-relative">
                                <div className="demo-img-patten-top d-none d-sm-block">
                                    <img src={imgpattern} className="d-block img-fluid" alt="" />
                                </div>
                                <div className="demo-img-patten-bottom d-none d-sm-block">
                                    <img src={imgpattern} className="d-block img-fluid" alt="" />
                                </div>
                                <div className="hero-slides-images">
                                    {heroImages.map((slide, index) => (
                                        <div
                                            key={slide.id}
                                            className={`hero-slide-image${index === activeSlide ? " is-active" : ""}`}
                                            aria-hidden={index !== activeSlide}
                                        >
                                            <img src={slide.image} className="d-block w-100" alt={slide.imageAlt} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Container>

                <div className="position-absolute start-0 end-0 bottom-0 hero-shape-svg">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        version="1.1"
                        viewBox="0 0 1440 120"
                    >
                        <g mask='url("#SvgjsMask1003")' fill="none">
                            <path d="M 0,118 C 288,98.6 1152,40.4 1440,21L1440 140L0 140z"></path>
                        </g>
                    </svg>
                </div>
            </section>
        </React.Fragment>
    );
};

export default Home;
