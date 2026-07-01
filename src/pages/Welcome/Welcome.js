import React, { useEffect, useState } from "react";
import { Container } from "reactstrap";

const Welcome = () => {
    document.title = "Welcome | DiaJewSoft";

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
        hour < 12
            ? "Good Morning ☀️"
            : hour < 17
                ? "Good Afternoon 🌤️"
                : "Good Evening 🌙";

    return (
        <div className="welcome-page">

            <div className="circle one"></div>
            <div className="circle two"></div>
            <div className="circle three"></div>

            <Container className="hero">
                <h5>{greeting}</h5>

                <h1>Welcome to DiaJewSoft</h1>

                <h3>{userName}</h3>

                <p>
                    Inventory Management • Purchase • Sales • Accounts
                </p>
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

    background:#212529 !important;

}

/* ==========================
   CENTER CONTENT
========================== */

.hero{

    position:relative;
    z-index:10;
    text-align:center;
    animation:fadeUp .8s ease;

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

    color:#adb5bd;

}

/* ==========================
   TITLE
========================== */

.hero h1{

    font-size:68px;
    font-weight:800;
    color:#405189;
    letter-spacing:-2px;
    margin-bottom:10px;
    animation:titleGlow 3s infinite;

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
    animation:userFloat 3s ease-in-out infinite;

}

/* ==========================
   SUB TITLE
========================== */

.hero p{

    font-size:22px;
    color:#6c757d;
    margin-top:20px;

}

[data-bs-theme="dark"] .hero p,
[data-layout-mode="dark"] .hero p{

    color:#ced4da;

}

/* ==========================
   TIME
========================== */

.clock{

    margin-top:35px;
    color:#405189;
    font-size:20px;
    font-weight:600;
    animation:pulse 2s infinite;

}

[data-bs-theme="dark"] .clock,
[data-layout-mode="dark"] .clock{

    color:#ffffff;

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

/* Dark circles */

[data-bs-theme="dark"] .one,
[data-layout-mode="dark"] .one{

    background:#4b6cb7;
    opacity:.10;

}

[data-bs-theme="dark"] .two,
[data-layout-mode="dark"] .two{

    background:#ffc107;
    opacity:.08;

}

[data-bs-theme="dark"] .three,
[data-layout-mode="dark"] .three{

    background:#20c997;
    opacity:.08;

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
   CLOCK
========================== */

@keyframes pulse{

0%,100%{

transform:scale(1);

}

50%{

transform:scale(1.05);

}

}

/* ==========================
   MOBILE
========================== */

@media(max-width:768px){

.hero h1{

font-size:42px;

}

.hero h3{

font-size:24px;

}

.hero p{

font-size:18px;

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