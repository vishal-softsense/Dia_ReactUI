import React from 'react';
import { Col, Container, Form, Row } from 'reactstrap';

const Contact = () => {
    return (
        <React.Fragment>
            <section className="section bg-light" id="contact">
                <Container>
                    <Row className="justify-content-center">
                        <Col lg={8}>
                            <div className="text-center mb-5">
                                <h3 className="mb-3 fw-semibold">Get In Touch</h3>
                                <p className="text-muted mb-4 ff-secondary">
                                    Have questions about DiaJew SoftOnCloud? Reach out and our team will help you get started with inventory, purchase, sales, and accounts.
                                </p>
                            </div>
                        </Col>
                    </Row>

                    <Row className="gy-4">
                        <Col lg={4}>
                            <div>
                                <div className="mt-4">
                                    <h5 className="fs-13 text-muted text-uppercase">Office Address:</h5>
                                    <div className="ff-secondary fw-semibold">
                                        909, Icon Business Center<br />
                                        Dumas Road<br />
                                        Surat - 395007
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <h5 className="fs-13 text-muted text-uppercase">Working Hours:</h5>
                                    <div className="ff-secondary fw-semibold">10:00am to 7:00pm</div>
                                </div>
                            </div>
                        </Col>

                        <Col lg={8}>
                            <div>
                                <Form>
                                    <Row>
                                        <Col lg={6}>
                                            <div className="mb-4">
                                                <label htmlFor="name" className="form-label fs-13">Name</label>
                                                <input
                                                    name="name"
                                                    id="name"
                                                    type="text"
                                                    className="form-control bg-white"
                                                    placeholder="Your name*"
                                                />
                                            </div>
                                        </Col>
                                        <Col lg={6}>
                                            <div className="mb-4">
                                                <label htmlFor="email" className="form-label fs-13">Email</label>
                                                <input
                                                    name="email"
                                                    id="email"
                                                    type="email"
                                                    className="form-control bg-white"
                                                    placeholder="Your email*"
                                                />
                                            </div>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col lg={12}>
                                            <div className="mb-4">
                                                <label htmlFor="subject" className="form-label fs-13">Subject</label>
                                                <input
                                                    type="text"
                                                    className="form-control bg-white"
                                                    id="subject"
                                                    name="subject"
                                                    placeholder="Your Subject.."
                                                />
                                            </div>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col lg={12}>
                                            <div className="mb-3">
                                                <label htmlFor="comments" className="form-label fs-13">Message</label>
                                                <textarea
                                                    name="comments"
                                                    id="comments"
                                                    rows="3"
                                                    className="form-control bg-white"
                                                    placeholder="Your message..."
                                                ></textarea>
                                            </div>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col lg={12} className="text-lg-end text-center">
                                            <input
                                                type="submit"
                                                id="submit"
                                                name="send"
                                                className="submitBnt btn btn-success w-100 w-lg-auto"
                                                value="Send Message"
                                            />
                                        </Col>
                                    </Row>
                                </Form>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>
        </React.Fragment>
    );
};

export default Contact;
