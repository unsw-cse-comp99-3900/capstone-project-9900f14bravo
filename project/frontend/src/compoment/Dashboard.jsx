import React from "react";
import NavBar from "./NavBar";
import intro from '../assets/intro.png'

function Dashboard(){
    const dashboardStyle = {
        display: 'flex',
        width: '100vw',
        height: 'calc(100vh - 80px)',
        alignItems: 'center',
    }
    const introStyle = {
        display: 'block',
        marginLeft: '100px',
    }
    return(
        <>
        <NavBar/>
        <div style={dashboardStyle}>
            <img src={intro} alt="introduction" style={introStyle}/>
        </div>
        </>
    )
};

export default Dashboard;