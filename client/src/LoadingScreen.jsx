import React from "react";
import { Backdrop } from "@material-ui/core";
import CircularProgress from "@material-ui/core/CircularProgress";

function LoadingScreen() {
  return (
    <Backdrop open={true} style={{ flexDirection: "column" }}>
      <CircularProgress />
      <p>Trying to connect to network..</p>
    </Backdrop>
  );
}

export default LoadingScreen;
