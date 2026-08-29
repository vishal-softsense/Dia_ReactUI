import React from 'react';
import { Link } from 'react-router-dom';
import { Col, Container, Input, Row } from 'reactstrap';

import { APP_LOGO as logoSm } from "../../../Components/constants/brandLogo";

const productLinks = [
    { label: "Inventory", to: "/landing#features" },
    { label: "Purchase", to: "/landing#services" },
    { label: "Sales", to: "/landing#services" },
    { label: "Accounts", to: "/landing#services" },
    { label: "Analytics", to: "/landing#features" },
    { label: "Reports", to: "/landing#features" },
    { label: "View All", href: "https://softoncloud.com/" },
];

const companyLinks = [
    { label: "About Us", href: "https://softoncloud.com/" },
    { label: "Careers", href: "https://softoncloud.com/" },
    { label: "Partners", href: "https://softoncloud.com/" },
    { label: "Blog", href: "https://softoncloud.com/" },
    { label: "Contact Us", to: "/landing#contact" },
];

const resourceLinks = [
    { label: "Documentation", href: "https://softoncloud.com/" },
    { label: "Help Center", to: "/landing#faqs" },
    { label: "API Docs", href: "https://softoncloud.com/" },
    { label: "Templates", href: "https://softoncloud.com/" },
    { label: "Status", href: "https://softoncloud.com/" },
];

const legalLinks = [
    { label: "Privacy Policy", to: "/pages-privacy-policy" },
    { label: "Terms of Service", to: "/pages-terms-condition" },
    { label: "Security", href: "https://softoncloud.com/" },
    { label: "Refund Policy", href: "https://softoncloud.com/" },
];

const socialLinks = [
    { icon: "ri-facebook-fill", href: "https://www.facebook.com/" },
    { icon: "ri-linkedin-fill", href: "https://www.linkedin.com/" },
    { icon: "ri-twitter-x-fill", href: "https://twitter.com/" },
    { icon: "ri-youtube-fill", href: "https://www.youtube.com/" },
    { icon: "ri-instagram-fill", href: "https://www.instagram.com/" },
];

const FooterLink = ({ item }) => {
    if (item.to) {
        return <Link to={item.to}>{item.label}</Link>;
    }
    return (
        <a href={item.href} target="_blank" rel="noopener noreferrer">
            {item.label}
        </a>
    );
};

const Footer = () => {
    return (
        <React.Fragment>
            <footer className="custom-footer landing-footer bg-dark py-5 position-relative">
                <Container>
                    <Row className="g-4">
                        <Col lg={3} md={6} className="landing-footer-brand-col">
                            <Link to="/landing" className="landing-footer-brand text-decoration-none">
                                <span className="landing-footer-brand-logo">
                                    <img
                                        src={logoSm}
                                        alt="DiaJewSoft SoftOnCloud"
                                        className="brand-logo-icon landing-footer-logo-img"
                                        width="36"
                                        height="36"
                                        style={{ borderRadius: "12px" }}
                                    />
                                    <span className="landing-footer-brand-text">
                                        <span className="landing-footer-brand-title">DiaJewSoft</span>
                                        <span className="landing-footer-brand-subtitle">SoftOnCloud</span>
                                    </span>
                                </span>
                            </Link>
                            <p className="text-muted mt-4 mb-4 ff-secondary">
                                One platform for diamond & jewellery inventory, purchase, sales, and accounts — with analytics built in.
                            </p>
                            <ul className="list-inline mb-0 footer-social-link">
                                {socialLinks.map((social) => (
                                    <li className="list-inline-item" key={social.icon}>
                                        <a
                                            href={social.href}
                                            className="avatar-xs d-block"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label={social.icon}
                                        >
                                            <div className="avatar-title rounded-circle">
                                                <i className={social.icon}></i>
                                            </div>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </Col>

                        <Col lg={2} md={6} sm={4}>
                            <h5 className="text-white mb-3">Products</h5>
                            <ul className="list-unstyled ff-secondary footer-list mb-0">
                                {productLinks.map((item) => (
                                    <li key={item.label}>
                                        <FooterLink item={item} />
                                    </li>
                                ))}
                            </ul>
                        </Col>

                        <Col lg={2} md={6} sm={4}>
                            <h5 className="text-white mb-3">Company</h5>
                            <ul className="list-unstyled ff-secondary footer-list mb-0">
                                {companyLinks.map((item) => (
                                    <li key={item.label}>
                                        <FooterLink item={item} />
                                    </li>
                                ))}
                            </ul>
                        </Col>

                        <Col lg={2} md={6} sm={4}>
                            <h5 className="text-white mb-3">Resources</h5>
                            <ul className="list-unstyled ff-secondary footer-list mb-0">
                                {resourceLinks.map((item) => (
                                    <li key={item.label}>
                                        <FooterLink item={item} />
                                    </li>
                                ))}
                            </ul>
                        </Col>

                        <Col lg={3} md={6}>
                            <h5 className="text-white mb-3">Newsletter</h5>
                            <p className="text-muted ff-secondary mb-3">
                                Stay updated with our latest features and updates.
                            </p>
                            <form
                                className="landing-footer-newsletter"
                                onSubmit={(event) => event.preventDefault()}
                            >
                                <div className="input-group">
                                    <Input
                                        type="email"
                                        className="form-control"
                                        placeholder="Enter your email"
                                        aria-label="Enter your email"
                                    />
                                    <button type="submit" className="btn btn-success">
                                        <i className="ri-send-plane-2-fill"></i>
                                    </button>
                                </div>
                            </form>
                            <div className="landing-footer-legal mt-4">
                                {legalLinks.map((item, index) => (
                                    <React.Fragment key={item.label}>
                                        {index > 0 && <span className="text-muted mx-1">·</span>}
                                        <FooterLink item={item} />
                                    </React.Fragment>
                                ))}
                            </div>
                        </Col>
                    </Row>
                </Container>
            </footer>
        </React.Fragment>
    );
};

export default Footer;
