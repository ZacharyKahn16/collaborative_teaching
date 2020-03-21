import React from 'react';
import logo from './logo.svg';
import './Styles/LoadingScreen.css';

function LoadingScreen() {
    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
                <p>
                    Loading.....................
                </p>
            </header>
        </div>
    );
}

export default LoadingScreen;
