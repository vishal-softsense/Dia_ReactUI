import React, { useEffect } from 'react';

import Navbar from './navbar';
import Home from './home';
import Services from './services';
import Features from './features';
import WorkProcess from './workProcess';
import Faqs from './faq';
import Pricing from './pricing';
import Contact from './contact';
import Footer from './footer';

const APP_BRAND_TITLE = "DiaJewel - Diamond & Jewellery Cloud Business App";
const APP_BRAND_DESCRIPTION = "Manage Inventory & Accounts";
const APP_SITE_ORIGIN = "https://jewel.softoncloud.com";
const APP_OG_IMAGE = `${APP_SITE_ORIGIN}/og-image.jpg?v=8`;

const setMetaTag = (selector, attr, value) => {
    let el = document.querySelector(selector);
    if (!el && selector.startsWith('meta[')) {
        el = document.createElement('meta');
        const propMatch = selector.match(/property="([^"]+)"/);
        const nameMatch = selector.match(/name="([^"]+)"/);
        if (propMatch) el.setAttribute('property', propMatch[1]);
        if (nameMatch) el.setAttribute('name', nameMatch[1]);
        document.head.appendChild(el);
    }
    if (el) el.setAttribute(attr, value);
};

/** Same Logo + Title + Description for every menu (matches #features / 3rd-image example) */
const applyBrandMeta = () => {
    document.title = APP_BRAND_TITLE;

    setMetaTag('meta[name="description"]', 'content', APP_BRAND_DESCRIPTION);
    setMetaTag('meta[property="og:title"]', 'content', APP_BRAND_TITLE);
    setMetaTag('meta[property="og:description"]', 'content', APP_BRAND_DESCRIPTION);
    setMetaTag('meta[property="og:image"]', 'content', APP_OG_IMAGE);
    setMetaTag('meta[property="og:image:secure_url"]', 'content', APP_OG_IMAGE);
    setMetaTag('meta[property="og:image:alt"]', 'content', 'DiaJewSoft Logo');
    setMetaTag('meta[property="og:url"]', 'content', `${APP_SITE_ORIGIN}/`);
    setMetaTag('meta[name="twitter:title"]', 'content', APP_BRAND_TITLE);
    setMetaTag('meta[name="twitter:description"]', 'content', APP_BRAND_DESCRIPTION);
    setMetaTag('meta[name="twitter:image"]', 'content', APP_OG_IMAGE);
};

const Index = () => {
    useEffect(() => {
        const syncFromHash = () => {
            applyBrandMeta();
        };

        syncFromHash();
        window.addEventListener('hashchange', syncFromHash);
        return () => window.removeEventListener('hashchange', syncFromHash);
    }, []);

    useEffect(() => {
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

        window.addEventListener('scroll', scrollFunction);
        return () => window.removeEventListener('scroll', scrollFunction);
    }, []);

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
