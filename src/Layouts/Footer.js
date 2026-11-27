import React from "react";
import { Container } from "reactstrap";
import { useTranslation } from "react-i18next";


const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="footer">
      <Container fluid>
        <div className="d-flex align-items-center justify-content-center text-center">
          <span className="footer-text">
            {t("Powered by")}{" "}
            <a
              href="https://softsense.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-brand-link"
            >
              SoftOnCloud
            </a>
          </span>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
