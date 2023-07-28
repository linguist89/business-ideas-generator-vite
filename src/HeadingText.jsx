import React from "react";
import './HeadingText.css';
import HeaderImage from './assets/images/2d_vector_background_image_transparent_v2.png';

function HeadingText(){
    return(
        <header className="header">
            <img src={HeaderImage} alt="header-image"></img>
            <div className="text-block">
                <h1>Business Ideas Generator</h1>
                <h2 className="hide-on-mobile">Generate Business Ideas, so you can start building right away!</h2>
            </div>
        </header>   
    );
}

export default HeadingText;
