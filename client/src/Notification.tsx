import React, { useEffect, useRef, useState, useContext } from "react";
import { makeStyles, Snackbar, createStyles } from "@material-ui/core";
import MuiAlert from "@material-ui/lab/Alert";
import { GlobalContext } from "./GlobalContext";

const notificationPopupStyles = () => {
  return createStyles({
    container: {
      position: "absolute",
      top: "64px",
      width: "100%",
      display: "flex",
      flexDirection: "column",
      height: "auto",
      maxHeight: "50vh",
      overflow: "hidden",
    },
    notification: {
      top: 0,
      position: "relative",
      marginBottom: "10px",
      maxWidth: "75%",
      left: "50%",
      transform: "translateX(-50%)",
      userSelect: "none",
    },
  });
};

function usePrevious(value: number): number {
  const ref = useRef<number>(0);

  useEffect(() => {
    ref.current = value;
  });

  return ref.current;
}

const AUTO_HIDE = 4 * 1000; // 4 secs

const useStyles = makeStyles(notificationPopupStyles);

const NotificationPopup = () => {
  const classes = useStyles();
  const { responses } = useContext(GlobalContext);

  const [activeNotif, setActiveNotif] = useState<null | any>(null);
  const prevCount = usePrevious(responses.length);

  function closeNotif() {
    setActiveNotif(null);
  }

  useEffect(() => {
    if (responses.length > prevCount && responses.length > 0) {
      const lastNotif = responses[responses.length - 1];

      if (typeof lastNotif.message === "string") {
        setActiveNotif(lastNotif);
      }
    }
  }, [activeNotif, prevCount, responses]);

  return (
    <div className={classes.container}>
      {activeNotif ? (
        <Snackbar
          open={true}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          className={classes.notification}
          autoHideDuration={AUTO_HIDE}
          transitionDuration={400}
          onClose={closeNotif}
        >
          <MuiAlert
            elevation={6}
            variant="filled"
            severity={activeNotif.status === "success" ? "success" : "error"}
            onClose={closeNotif}
          >
            {activeNotif.message}
          </MuiAlert>
        </Snackbar>
      ) : null}
    </div>
  );
};

export default NotificationPopup;
