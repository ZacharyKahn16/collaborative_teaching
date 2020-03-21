import React from "react";
import { Backdrop } from "@material-ui/core";
import logo from "./logo.svg";
import "./Styles/LoadingScreen.css";

function LoadingScreen() {
  return (
    <div className="App">
      <header className="App-header">
        <Backdrop open={true} style={{ flexDirection: "column" }}>
          <img src={logo} className="App-logo" alt="logo" />
          <p>Loading...</p>
        </Backdrop>
      </header>
    </div>
  );
}

export default LoadingScreen;
