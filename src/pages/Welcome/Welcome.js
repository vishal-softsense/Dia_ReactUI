import React, { useEffect, useState } from "react";
import { Container } from "reactstrap";
import { useTranslation } from "react-i18next";

const Welcome = () => {
    const { t } = useTranslation();
    document.title = `${t("Welcome")} | ${t("DiaJewSoft")}`;

    const [userName, setUserName] = useState("Admin");
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        let auth =
            sessionStorage.getItem("authUser") ||
            localStorage.getItem("authUser");

        if (auth) {
            const obj = JSON.parse(auth);
            const u = obj.user || obj.User || obj;
            setUserName(u.UserName || u.userName || "Admin");
        }

        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const hour = time.getHours();

    const greeting =
        hour < 5
            ? t("Good Night 🌃")
            : hour < 12
                ? t("Good Morning ☀️")
                : hour < 17
                    ? t("Good Afternoon 🌤️")
                    : hour < 22
                        ? t("Good Evening 🌙")
                        : t("Good Night 🌃");

    return (
        <div className="welcome-page">

            <div className="circle one"></div>
            <div className="circle two"></div>
            <div className="circle three"></div>

            <Container className="hero">
                <h5>{greeting}</h5>

                <h1>{t("Welcome to DiaJewSoft")}</h1>

                <h3>{userName}</h3>

                <p className="mb-0">
                    {t("Inventory Management • Purchase • Sales • Accounts")}
                </p>

                <div className="clock">
                    <i className="ri-time-line me-2 align-middle"></i>
                    {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
            </Container>

            <style>{`

/* ==========================
   PAGE
========================== */

.welcome-page{
    height:100vh;
    display:flex;
    justify-content:center;
    align-items:center;
    position:relative;
    overflow:hidden;

    background:linear-gradient(-45deg,#eef4ff,#ffffff,#f7fbff,#edf5ff);
    background-size:400% 400%;
    animation:bgMove 12s ease infinite;
    transition:all .4s ease;
}

/* ==========================
   DARK MODE
========================== */

[data-bs-theme="dark"] .welcome-page,
[data-layout-mode="dark"] .welcome-page,
html[data-bs-theme="dark"] .welcome-page,
body[data-bs-theme="dark"] .welcome-page{
    background: linear-gradient(-45deg, #16191c, #1f2429, #1a1d21, #131517) !important;
}

/* ==========================
   CENTER CONTENT WITH GLASSMORPHISM
========================== */

.hero{
    position:relative;
    z-index:10;
    text-align:center;
    animation:fadeUp .8s ease;
    background: rgba(255, 255, 255, 0.45);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.35);
    padding: 50px 70px;
    border-radius: 24px;
    box-shadow: 0 10px 40px 0 rgba(64, 81, 137, 0.08);
    max-width: 800px;
}

[data-bs-theme="dark"] .hero,
[data-layout-mode="dark"] .hero{
    background: rgba(30, 32, 37, 0.55);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 10px 40px 0 rgba(0, 0, 0, 0.25);
}

/* ==========================
   GREETING
========================== */

.hero h5{
    color:#405189;
    font-size:22px;
    font-weight:600;
    margin-bottom:15px;
}

[data-bs-theme="dark"] .hero h5,
[data-layout-mode="dark"] .hero h5{
    color:#a6b0cf;
}

/* ==========================
   TITLE
========================== */

.hero h1{
    font-size: clamp(28px, 4.5vw, 60px);
    font-weight:800;
    color:#405189;
    letter-spacing:-1.5px;
    margin-bottom:10px;
    animation:titleGlow 3s infinite;
    white-space: nowrap;
}

[data-bs-theme="dark"] .hero h1,
[data-layout-mode="dark"] .hero h1{
    color:#ffffff;
}

/* ==========================
   USER NAME
========================== */

.hero h3{
    color:#0ab39c;
    font-size:34px;
    font-weight:700;
    margin-top:10px;
    margin-bottom:15px;
    animation:userFloat 3s ease-in-out infinite;
}

/* ==========================
   SUB TITLE
========================== */

.hero p{
    font-size:18px;
    color:#5c646b;
    margin-top:10px;
}

[data-bs-theme="dark"] .hero p,
[data-layout-mode="dark"] .hero p{
    color:#abb9e8;
}

/* ==========================
   CLOCK
========================== */

.clock{
    margin-top:30px;
    color:#405189;
    font-size:22px;
    font-weight:700;
    letter-spacing: 1px;
    background: rgba(64, 81, 137, 0.06);
    padding: 10px 24px;
    border-radius: 12px;
    display: inline-flex;
    align-items: center;
    border: 1px solid rgba(64, 81, 137, 0.1);
}

[data-bs-theme="dark"] .clock,
[data-layout-mode="dark"] .clock{
    color:#405189;
    background: rgba(64, 81, 137, 0.15);
    border: 1px solid rgba(64, 81, 137, 0.25);
    color: #405189;
}

[data-bs-theme="dark"] .clock,
[data-layout-mode="dark"] .clock {
    color: #0ab39c;
    background: rgba(10, 179, 156, 0.1);
    border: 1px solid rgba(10, 179, 156, 0.2);
}

/* ==========================
   FLOATING CIRCLES
========================== */

.circle{
    position:absolute;
    border-radius:50%;
    animation:circleMove 8s ease-in-out infinite alternate;
}

/* Left */

.one{
    width:280px;
    height:280px;
    background:#405189;
    opacity:.12;

    left:-90px;
    top:70px;
}

/* Right Top */

.two{
    width:180px;
    height:180px;
    background:#f7b84b;
    opacity:.16;

    right:120px;
    top:70px;
}

/* Right Bottom */

.three{
    width:330px;
    height:330px;
    background:#0ab39c;
    opacity:.15;

    right:-120px;
    bottom:-120px;
}

/* Dark circles with glows */

[data-bs-theme="dark"] .one,
[data-layout-mode="dark"] .one{
    background: radial-gradient(circle, rgba(75, 108, 183, 0.25) 0%, rgba(75, 108, 183, 0) 70%);
    opacity:1;
}

[data-bs-theme="dark"] .two,
[data-layout-mode="dark"] .two{
    background: radial-gradient(circle, rgba(255, 193, 7, 0.2) 0%, rgba(255, 193, 7, 0) 70%);
    opacity:1;
}

[data-bs-theme="dark"] .three,
[data-layout-mode="dark"] .three{
    background: radial-gradient(circle, rgba(32, 201, 151, 0.2) 0%, rgba(32, 201, 151, 0) 70%);
    opacity:1;
}

/* ==========================
   BACKGROUND ANIMATION
========================== */

@keyframes bgMove{
0%{
background-position:0% 50%;
}
50%{
background-position:100% 50%;
}
100%{
background-position:0% 50%;
}
}

/* ==========================
   FADE
========================== */

@keyframes fadeUp{
from{
opacity:0;
transform:translateY(40px);
}
to{
opacity:1;
transform:translateY(0);
}
}

/* ==========================
   FLOAT
========================== */

@keyframes circleMove{
0%{
transform:translateY(0px);
}
100%{
transform:translateY(25px);
}
}

/* ==========================
   USER FLOAT
========================== */

@keyframes userFloat{
0%,100%{
transform:translateY(0);
}
50%{
transform:translateY(-6px);
}
}

/* ==========================
   GLOW
========================== */

@keyframes titleGlow{
0%,100%{
text-shadow:0 0 0 rgba(64,81,137,.15);
}
50%{
text-shadow:0 0 18px rgba(64,81,137,.20);
}
}

/* ==========================
   MOBILE
========================== */

@media(max-width:768px){
.hero{
    padding: 30px 20px;
    margin: 15px;
}
.hero h1{
font-size:38px;
}
.hero h3{
font-size:24px;
}
.hero p{
font-size:16px;
}
.hero h5{
font-size:18px;
}
.one{
width:180px;
height:180px;
}
.two{
width:120px;
height:120px;
}
.three{
width:220px;
height:220px;
}
}

`}</style>
        </div>
    );
};

export default Welcome;