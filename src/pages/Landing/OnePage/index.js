import React from 'react';

import Navbar from './navbar';
import Home from './home';
import Services from './services';
import Features from './features';
import WorkProcess from './workProcess';
import Faqs from './faq';
import Pricing from './pricing';
import Contact from './contact';
import Footer from './footer';

const Index = () => {
    document.title = "Landing | DiaJew SoftOnCloud";

    window.onscroll = function () {
        scrollFunction();
    };

    const scrollFunction = () => {
        const element = document.getElementById("back-to-top");
        if (element) {
            if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
                element.style.display = "block";
            } else {
                element.style.display = "none";
            }
        }
    };

    const toTop = () => {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    };

    return (
        <React.Fragment>
            <div className="layout-wrapper landing">
                <Navbar />
                <Home />
                <Services />
                <Features />
                <WorkProcess />
                <Faqs />
                <Pricing />
                <Contact />
                <Footer />
                <button onClick={() => toTop()} className="btn btn-success btn-icon landing-back-top" id="back-to-top">
                    <i className="ri-arrow-up-line"></i>
                </button>
            </div>
        </React.Fragment>
    );
};

export default Index;
