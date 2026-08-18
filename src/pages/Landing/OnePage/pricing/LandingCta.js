import React from "react";
import { Col, Container, Row } from "reactstrap";
import { Link } from "react-router-dom";

const LandingCta = ({
  title = "Need a custom plan for your organization?",
  buttonLabel = "Contact Sales",
  buttonLink = "/#contact",
  variant = "soft",
}) => {
  if (variant === "soft") {
    return (
      <section className="py-5" data-aos="fade-up" data-aos-delay="180" data-aos-duration="750" id="contact">
        <Container>
          <div className="landing-cta-soft d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-3">
              <span className="avatar-md flex-shrink-0">
                <span className="avatar-title bg-primary-subtle text-primary rounded-circle fs-20">
                  <i className="ri-group-line"></i>
                </span>
              </span>
              <h4 className="mb-0 fw-semibold">{title}</h4>
            </div>
            <Link to={buttonLink} className="btn btn-primary flex-shrink-0">
              {buttonLabel}
            </Link>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className="py-5 bg-primary position-relative" data-aos="fade-up" data-aos-delay="180" data-aos-duration="750" id="contact">
      <div className="bg-overlay bg-overlay-pattern opacity-50"></div>
      <Container>
        <Row className="align-items-center gy-4">
          <Col sm>
            <h4 className="text-white mb-0 fw-semibold">{title}</h4>
          </Col>
          <Col sm="auto">
            <Link to={buttonLink} className="btn bg-gradient btn-light landing-glow-button">
              <i className="ri-customer-service-2-line align-middle me-1"></i>
              {buttonLabel}
            </Link>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default LandingCta;
