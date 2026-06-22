import React, { useEffect, useState } from 'react';
import { Container, Row, Col } from 'reactstrap';

const Welcome = () => {
    document.title = "Welcome | DiaJewSoft";
    const [userName, setUserName] = useState("");

    useEffect(() => {
        let authUserStr = sessionStorage.getItem("authUser") || localStorage.getItem("authUser");
        if (authUserStr) {
            const obj = JSON.parse(authUserStr);
            const u = obj.user || obj.User || obj;
            setUserName(u.UserName || u.userName || u.username || "Admin");
        }
    }, []);

    return (
        <React.Fragment>
            <div className="page-content" style={{ backgroundColor: "transparent" }}>
                <Container fluid>
                    <Row className="justify-content-center align-items-center" style={{ minHeight: "75vh" }}>
                        <Col className="text-center" style={{ animation: "fadeIn 1.2s ease-in-out" }}>
                            <h1 className="display-5 fw-bold" style={{ color: "#405189", letterSpacing: "-0.5px" }}>
                                Welcome to DiaJewSoft
                            </h1>
                            <p className="text-muted fs-20 mt-3">
                                Welcome back, {userName}
                            </p>
                        </Col>
                    </Row>
                </Container>
            </div>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </React.Fragment>
    );
};

export default Welcome;
