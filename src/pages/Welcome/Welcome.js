import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Welcome = () => {
    const { t } = useTranslation();
    document.title = `${t("Welcome")} | ${t("DiaJewSoft")}`;

    const [userName, setUserName] = useState("Admin");
    const [greeting, setGreeting] = useState("Good Morning ☀️");

    useEffect(() => {
        let auth =
            sessionStorage.getItem("authUser") ||
            localStorage.getItem("authUser");

        if (auth) {
            const obj = JSON.parse(auth);
            const u = obj.user || obj.User || obj;
            setUserName(u.UserName || u.userName || "Admin");
        }

        const hour = new Date().getHours();
        const g = hour < 5
            ? t("Good Night 🌃")
            : hour < 12
                ? t("Good Morning ☀️")
                : hour < 17
                    ? t("Good Afternoon 🌤️")
                    : hour < 22
                        ? t("Good Evening 🌙")
                        : t("Good Night 🌃");
        setGreeting(g);
    }, [t]);

    const modules = [
        {
            title: t("Inventory"),
            description: t("Track diamonds, jewellery stock, and movements in real time."),
            link: "/solitaire/stock-search",
            iconClass: "ri-box-3-line",
            colorClass: "inventory"
        },
        {
            title: t("Purchase"),
            description: t("Manage suppliers, purchase orders, and inward entries."),
            link: "/dashboard/purchase-analysis",
            iconClass: "ri-shopping-cart-2-line",
            colorClass: "purchase"
        },
        {
            title: t("Sales"),
            description: t("Create invoices, track customers, and monitor sales flow."),
            link: "/dashboard/sale-analysis",
            iconClass: "ri-bill-line",
            colorClass: "sales"
        },
        {
            title: t("Accounts"),
            description: t("Ledgers, payments, receipts, and financial summaries."),
            link: "/account/list-accountgroup",
            iconClass: "ri-wallet-3-line",
            colorClass: "accounts"
        }
    ];

    return (
        <div className="page-content welcome-page-content">
            <div className="welcome-page">


                <div className="welcome-container">
                    <div className="welcome-banner">
                        <div className="banner-content">
                            <span className="banner-greeting">{greeting}</span>
                            <h2 className="banner-title">{t("Welcome to DiaJewSoft")}</h2>

                            <div className="banner-meta">
                                <div className="user-badge">
                                    <i className="ri-user-line me-2"></i>
                                    {userName}
                                </div>
                                <p className="banner-subtitle">
                                    {t("Inventory Management • Purchase • Sales • Accounts")}
                                </p>
                            </div>
                        </div>

                        <div className="banner-watermark" aria-hidden="true">
                            <svg width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M12 3 Q12 12 21 12 Q12 12 12 21 Q12 12 3 12 Q12 12 12 3 Z" strokeLinecap="round" strokeLinejoin="round" />
                                <circle cx="6" cy="18" r="1.5" />
                                <path d="M18 5h2M19 4v2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>

                    <div className="modules-grid">
                        {modules.map((mod, idx) => (
                            <Link to={mod.link} key={idx} className="module-card-link">
                                <div className="module-card">
                                    <div className={`module-icon-wrapper ${mod.colorClass}`}>
                                        <i className={`${mod.iconClass} module-icon`}></i>
                                    </div>
                                    <h3 className="module-title">{mod.title}</h3>
                                    <p className="module-description">{mod.description}</p>
                                    <div className="module-link-action">
                                        <span>{t("Open Module")}</span>
                                        <i className="ri-arrow-right-line arrow-icon"></i>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    <div className="welcome-footer-text">
                        {t("Select a module above to begin. Need help? Contact your system administrator.")}
                    </div>
                </div>

                <style>{`
/* ==========================
   PAGE SHELL (fits Velzon layout)
========================== */
.page-content.welcome-page-content {
    box-sizing: border-box !important;
    width: 100%;
    max-width: 100%;
    overflow-x: hidden !important;
    overflow-y: visible !important;
    display: flex !important;
    flex-direction: column !important;
    /* Fill one viewport; padding already clears header + footer */
    min-height: 100vh;
    min-height: 100dvh;
    background: transparent !important;
}

.welcome-page {
    /* Auto margins center vertically; collapse safely if content is taller than viewport */
    margin-top: auto;
    margin-bottom: auto;
    width: 100%;
    max-width: 100%;
    position: relative;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    overflow: hidden;
    padding: 12px 0 16px;
    background: transparent;
}

/* ==========================
   SHAPE WATERMARKS ONLY
========================== */
.bg-watermark {
    position: absolute;
    pointer-events: none;
    z-index: 1;
    max-width: 36%;
    max-height: 45%;
}

.bg-watermark svg {
    display: block;
    max-width: 100%;
    height: auto;
}

.bg-watermark.top-right {
    top: 2%;
    right: 1%;
    color: rgba(64, 81, 137, 0.06);
}

.bg-watermark.bottom-left {
    bottom: 2%;
    left: 1%;
    color: rgba(64, 81, 137, 0.05);
}

[data-bs-theme="dark"] .bg-watermark.top-right,
[data-layout-mode="dark"] .bg-watermark.top-right,
[data-bs-theme="dark"] .bg-watermark.bottom-left,
[data-layout-mode="dark"] .bg-watermark.bottom-left {
    color: rgba(255, 255, 255, 0.04);
}

/* ==========================
   CONTAINER
========================== */
.welcome-container {
    position: relative;
    z-index: 10;
    width: 100%;
    max-width: 1140px;
    margin: 0 auto;
    padding: 0 8px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    box-sizing: border-box;
}

/* ==========================
   WELCOME BANNER
========================== */
.welcome-banner {
    position: relative;
    background: linear-gradient(135deg, #ffffff 0%, #f1f4fa 100%);
    border: 1px solid rgba(64, 81, 137, 0.12);
    border-radius: 16px;
    padding: 20px 28px;
    color: #0b1c3f;
    overflow: hidden;
    box-shadow: 0 8px 28px rgba(64, 81, 137, 0.06);
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    box-sizing: border-box;
    animation: welcomeSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
}

[data-bs-theme="dark"] .welcome-banner,
[data-layout-mode="dark"] .welcome-banner {
    background: linear-gradient(135deg, #1f2227 0%, #171a1f 100%);
    border-color: rgba(255, 255, 255, 0.08);
    color: #ffffff;
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
}

.banner-content {
    position: relative;
    z-index: 5;
    max-width: calc(100% - 100px);
    min-width: 0;
}

.banner-greeting {
    font-size: 14px;
    font-weight: 600;
    color: #405189;
    display: block;
    margin-bottom: 6px;
    letter-spacing: 0.5px;
}

[data-bs-theme="dark"] .banner-greeting,
[data-layout-mode="dark"] .banner-greeting {
    color: #abb9e8;
}

.banner-title {
    font-size: clamp(20px, 2.2vw, 28px);
    font-weight: 700;
    color: #2a385c;
    margin: 0 0 12px 0;
    letter-spacing: -0.5px;
    line-height: 1.25;
    word-wrap: break-word;
}

[data-bs-theme="dark"] .banner-title,
[data-layout-mode="dark"] .banner-title {
    color: #ffffff;
}

.banner-meta {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
}

.user-badge {
    display: inline-flex;
    align-items: center;
    background: rgba(64, 81, 137, 0.08);
    border: 1px solid rgba(64, 81, 137, 0.15);
    color: #405189;
    padding: 5px 12px;
    border-radius: 50px;
    font-size: 12.5px;
    font-weight: 600;
    max-width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

[data-bs-theme="dark"] .user-badge,
[data-layout-mode="dark"] .user-badge {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.12);
    color: #ffffff;
}

.banner-subtitle {
    font-size: 13.5px;
    color: #596c80;
    margin: 0;
    word-wrap: break-word;
}

[data-bs-theme="dark"] .banner-subtitle,
[data-layout-mode="dark"] .banner-subtitle {
    color: #94a3b8;
}

.banner-watermark {
    position: absolute;
    right: 28px;
    top: 50%;
    transform: translateY(-50%);
    color: rgba(64, 81, 137, 0.08);
    pointer-events: none;
    z-index: 1;
}

[data-bs-theme="dark"] .banner-watermark,
[data-layout-mode="dark"] .banner-watermark {
    color: rgba(255, 255, 255, 0.04);
}

/* ==========================
   MODULES GRID
========================== */
.modules-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
    width: 100%;
    box-sizing: border-box;
}

.module-card-link {
    text-decoration: none !important;
    color: inherit;
    display: block;
    min-width: 0;
    max-width: 100%;
}

.modules-grid .module-card-link:nth-child(1) {
    animation: welcomeSlideUp 0.65s cubic-bezier(0.16, 1, 0.3, 1) 0.08s both;
}
.modules-grid .module-card-link:nth-child(2) {
    animation: welcomeSlideUp 0.65s cubic-bezier(0.16, 1, 0.3, 1) 0.16s both;
}
.modules-grid .module-card-link:nth-child(3) {
    animation: welcomeSlideUp 0.65s cubic-bezier(0.16, 1, 0.3, 1) 0.24s both;
}
.modules-grid .module-card-link:nth-child(4) {
    animation: welcomeSlideUp 0.65s cubic-bezier(0.16, 1, 0.3, 1) 0.32s both;
}

.module-card {
    background: #ffffff;
    border: 1px solid rgba(0, 0, 0, 0.05);
    border-radius: 14px;
    padding: 16px 16px 14px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
    height: 100%;
    display: flex;
    flex-direction: column;
    transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
    position: relative;
    overflow: hidden;
    box-sizing: border-box;
    width: 100%;
}

[data-bs-theme="dark"] .module-card,
[data-layout-mode="dark"] .module-card {
    background: #1a1d21;
    border-color: rgba(255, 255, 255, 0.06);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.module-card::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    border-radius: 0 0 14px 14px;
    opacity: 0.18;
    transition: opacity 0.25s ease;
}

.module-card-link:nth-child(1) .module-card::after { background: #405189; }
.module-card-link:nth-child(2) .module-card::after { background: #f7b84b; }
.module-card-link:nth-child(3) .module-card::after { background: #0ab39c; }
.module-card-link:nth-child(4) .module-card::after { background: #f06548; }

.module-card-link:hover .module-card::after {
    opacity: 1;
}

.module-card-link:nth-child(1) .module-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 22px rgba(64, 81, 137, 0.12);
    border-color: rgba(64, 81, 137, 0.18);
}
.module-card-link:nth-child(2) .module-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 22px rgba(247, 184, 75, 0.12);
    border-color: rgba(247, 184, 75, 0.18);
}
.module-card-link:nth-child(3) .module-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 22px rgba(10, 179, 156, 0.12);
    border-color: rgba(10, 179, 156, 0.18);
}
.module-card-link:nth-child(4) .module-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 22px rgba(240, 101, 72, 0.12);
    border-color: rgba(240, 101, 72, 0.18);
}

.module-icon-wrapper {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
    font-size: 20px;
    flex-shrink: 0;
    transition: transform 0.25s ease;
}

.module-card:hover .module-icon-wrapper {
    transform: scale(1.06);
}

.module-icon-wrapper.inventory {
    background: rgba(64, 81, 137, 0.08);
    color: #405189;
}
.module-icon-wrapper.purchase {
    background: rgba(247, 184, 75, 0.1);
    color: #d9a12e;
}
.module-icon-wrapper.sales {
    background: rgba(10, 179, 156, 0.08);
    color: #0ab39c;
}
.module-icon-wrapper.accounts {
    background: rgba(240, 101, 72, 0.08);
    color: #f06548;
}

[data-bs-theme="dark"] .module-icon-wrapper.inventory {
    background: rgba(171, 185, 232, 0.12);
    color: #abb9e8;
}
[data-bs-theme="dark"] .module-icon-wrapper.purchase {
    background: rgba(247, 184, 75, 0.12);
    color: #f7b84b;
}
[data-bs-theme="dark"] .module-icon-wrapper.sales {
    background: rgba(10, 179, 156, 0.12);
    color: #0ab39c;
}
[data-bs-theme="dark"] .module-icon-wrapper.accounts {
    background: rgba(240, 101, 72, 0.12);
    color: #f06548;
}

.module-title {
    font-size: 15.5px;
    font-weight: 700;
    color: #0b1c3f;
    margin: 0 0 6px 0;
}

[data-bs-theme="dark"] .module-title,
[data-layout-mode="dark"] .module-title {
    color: #ffffff;
}

.module-description {
    font-size: 12.5px;
    line-height: 1.5;
    color: #74788d;
    margin: 0 0 12px 0;
    flex-grow: 1;
    word-wrap: break-word;
    overflow-wrap: break-word;
}

[data-bs-theme="dark"] .module-description,
[data-layout-mode="dark"] .module-description {
    color: #94a3b8;
}

.module-link-action {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12.5px;
    font-weight: 700;
    color: #405189;
    transition: color 0.2s ease;
}

[data-bs-theme="dark"] .module-link-action,
[data-layout-mode="dark"] .module-link-action {
    color: #abb9e8;
}

.arrow-icon {
    font-size: 13px;
    transition: transform 0.2s ease;
}

.module-card:hover .module-link-action {
    color: #0ab39c;
}

.module-card:hover .arrow-icon {
    transform: translateX(4px);
}

/* ==========================
   FOOTER TEXT
========================== */
.welcome-footer-text {
    text-align: center;
    font-size: 13px;
    color: #878a99;
    margin: 0;
    padding: 0 8px 2px;
    letter-spacing: 0.2px;
    line-height: 1.5;
    animation: welcomeFadeIn 0.8s ease 0.4s both;
}

[data-bs-theme="dark"] .welcome-footer-text,
[data-layout-mode="dark"] .welcome-footer-text {
    color: #878a99;
}

/* ==========================
   ANIMATIONS
========================== */
@keyframes welcomeSlideUp {
    from {
        opacity: 0;
        transform: translateY(18px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes welcomeFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

/* ==========================
   RESPONSIVE
========================== */
@media (max-width: 1199.98px) {
    .welcome-container {
        max-width: 100%;
    }

    .modules-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
    }
}

@media (max-width: 991.98px) {
    .page-content.welcome-page-content {
        min-height: auto;
        justify-content: flex-start;
    }

    .welcome-page {
        margin-top: 0;
        margin-bottom: 0;
        padding: 4px 0 12px;
    }

    .welcome-container {
        gap: 14px;
        padding: 0 4px;
    }

    .banner-content {
        max-width: 100%;
    }

    .banner-watermark {
        opacity: 0.5;
        right: 16px;
    }
}

@media (max-width: 767.98px) {
    .page-content.welcome-page-content {
        padding-left: 12px !important;
        padding-right: 12px !important;
    }

    .welcome-banner {
        padding: 16px 16px;
    }

    .banner-title {
        font-size: 22px;
        margin-bottom: 10px;
    }

    .banner-meta {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }

    .banner-watermark {
        display: none;
    }

    .modules-grid {
        grid-template-columns: minmax(0, 1fr);
        gap: 12px;
    }

    .module-card {
        padding: 16px;
    }

    .welcome-footer-text {
        font-size: 12px;
    }
}

@media (max-height: 780px) and (min-width: 992px) {
    .welcome-container {
        gap: 12px;
    }

    .welcome-banner {
        padding: 14px 22px;
    }

    .banner-title {
        margin-bottom: 8px;
        font-size: 22px;
    }

    .modules-grid {
        gap: 10px;
    }

    .module-card {
        padding: 12px 14px;
    }

    .module-icon-wrapper {
        margin-bottom: 8px;
        width: 34px;
        height: 34px;
        font-size: 17px;
    }

    .module-description {
        margin-bottom: 8px;
        font-size: 12px;
    }

    .module-title {
        font-size: 14.5px;
    }
}

@media (prefers-reduced-motion: reduce) {
    .welcome-banner,
    .module-card-link,
    .welcome-footer-text {
        animation: none !important;
    }
}
`}</style>
            </div>
        </div>
    );
};

export default Welcome;
