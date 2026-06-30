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

.welcome-page{

height:100vh;
display:flex;
justify-content:center;
align-items:center;
position:relative;
overflow:hidden;

background:linear-gradient(-45deg,#eef2ff,#ffffff,#f6fbff,#edf4ff);

background-size:400% 400%;

animation:bg 15s ease infinite;

}

@keyframes bg{

0%{background-position:0% 50%;}

50%{background-position:100% 50%;}

100%{background-position:0% 50%;}

}

.hero{

position:relative;

text-align:center;

z-index:5;

animation:fade 1s ease;

}

@keyframes fade{

from{

opacity:0;

transform:translateY(40px);

}

to{

opacity:1;

transform:translateY(0);

}

}

.diamond{

font-size:85px;

animation:float 3s ease-in-out infinite;

margin-bottom:25px;

}

@keyframes float{

0%,100%{

transform:translateY(0px);

}

50%{

transform:translateY(-15px);

}

}

h1{

font-size:55px;

font-weight:700;

color:#405189;

margin-bottom:10px;

}

h3{

color:#0ab39c;

font-weight:600;

margin-top:10px;

}

h5{

color:#405189;

font-weight:600;

margin-bottom:15px;

}

p{

font-size:20px;

color:#6c757d;

margin-top:20px;

}

.clock{

margin-top:35px;

font-size:22px;

font-weight:600;

color:#405189;

animation:pulse 2s infinite;

}

@keyframes pulse{

50%{

transform:scale(1.05);

}

}

.circle{

position:absolute;

border-radius:50%;

opacity:.18;

animation:move 10s infinite alternate;

}

.one{

width:220px;

height:220px;

background:#405189;

left:-80px;

top:80px;

}

.two{

width:300px;

height:300px;

background:#0ab39c;

right:-120px;

bottom:40px;

}

.three{

width:150px;

height:150px;

background:#f7b84b;

right:20%;

top:8%;

}

@keyframes move{

from{

transform:translateY(0px);

}

to{

transform:translateY(30px);

}

}

`}</style>

        </div>
    );
};

export default Welcome;