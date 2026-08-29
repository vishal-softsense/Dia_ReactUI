import React from "react";
import { Col } from "reactstrap";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { Link } from "react-router-dom";

// Import Images
import { APP_LOGO as logoSm } from "../../Components/constants/brandLogo";

const AuthSlider = () => {
    return (
        <React.Fragment>

            <Col lg={6}>
                <div className="p-lg-5 p-4 auth-one-bg h-100">
                    <div className="bg-overlay"></div>
                    <div className="position-relative h-100 d-flex flex-column">
                        <div className="mb-4">
                            <Link to="/dashboard" className="d-block">
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                                    <img src={logoSm} alt="DiaJewSoft" height="24" style={{ borderRadius: "6px" }} />
                                    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.1 }}>
                                        <span style={{ color: "#fff", fontSize: "0.9rem", fontWeight: 700 }}>DiaJewSoft</span>
                                        <span style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.6rem", fontWeight: 500 }}>SoftOnCloud</span>
                                    </span>
                                </span>
                            </Link>
                        </div>
                        <div className="mt-auto">
                            <div className="mb-3">
                                <i className="ri-double-quotes-l display-4 text-success"></i>
                            </div>

                            <Carousel showThumbs={false} autoPlay={true} showArrows={false} showStatus={false} infiniteLoop={true} className="slide" id="qoutescarouselIndicators">
                                <div className="carousel-inner text-center text-white-50 pb-5">
                                    <div className="item">
                                        <p className="fs-15 fst-italic">" Great! Clean code, clean design, easy for customization. Thanks very much! "</p>
                                    </div>
                                </div>
                                <div className="carousel-inner text-center text-white-50 pb-5">
                                    <div className="item">
                                        <p className="fs-15 fst-italic">" The theme is really great with an amazing customer support."</p>
                                    </div>
                                </div>
                                <div className="carousel-inner text-center text-white-50 pb-5">
                                    <div className="item">
                                        <p className="fs-15 fst-italic">" Great! Clean code, clean design, easy for customization. Thanks very much! "</p>
                                    </div>
                                </div>
                            </Carousel>

                        </div>
                    </div>
                </div>
            </Col>
        </React.Fragment >
    );
};

export default AuthSlider;