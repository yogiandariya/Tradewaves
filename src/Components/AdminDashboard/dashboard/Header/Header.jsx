import {Typography, Image } from "antd";
import "./Header.css"

function Header(){

    return(
        <div className="Header">
            <Image src="/logo2.png" width={38}/>
            <Typography.Title>Tradewaves</Typography.Title>
        </div>
    )
};
export default Header;