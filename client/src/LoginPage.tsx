import React, { useState, FormEvent } from "react";
import {
  Avatar,
  Button,
  TextField,
  Typography,
  makeStyles,
  Grid,
  Paper,
  createStyles,
  Theme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from "@material-ui/core";
import LockOutlinedIcon from "@material-ui/icons/LockOutlined";
import LockOpenOutlineIcon from "@material-ui/icons/LockOpenOutlined";
import { AUTH } from "./Firebase";

const useStyles = makeStyles((theme: Theme) => {
  return createStyles({
    root: {
      width: "100vw",
      height: "100vh",
    },
    paper: {
      margin: theme.spacing(10, 4),
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    },
    avatar: {
      margin: theme.spacing(1),
      backgroundColor: theme.palette.secondary.main,
    },
    form: {
      width: "100%", // Fix IE 11 issue.
      marginTop: theme.spacing(1),
    },
    submit: {
      margin: theme.spacing(3, 0, 2),
    },
    image: {
      backgroundImage:
        "url(https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2053&q=80)",
      backgroundRepeat: "no-repeat",
      backgroundColor: theme.palette.grey[50],
      backgroundSize: "cover",
      backgroundPosition: "center",
    },
  });
});

export default function LoginPage() {
  const classes = useStyles();
  const [login, setLogin] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<any>(null);

  function toggleLogin() {
    setLogin(!login);
  }

  function closeDialog() {
    setError(null);
  }

  function submit(event: FormEvent) {
    if (login) {
      AUTH.signInWithEmailAndPassword(email, password).catch((err) => {
        setError(err);
      });
    } else {
      AUTH.createUserWithEmailAndPassword(email, password)
        .then((result) => {
          if (result && result.user) {
            result.user.updateProfile({
              displayName: name,
            });
          }
        })
        .catch((err) => {
          setError(err);
        });
    }
  }

  return (
    <Grid container={true} className={classes.root}>
      <Dialog
        open={Boolean(error)}
        disableBackdropClick={false}
        disableEscapeKeyDown={false}
        onClose={closeDialog}
      >
        <DialogTitle>Error</DialogTitle>
        <DialogContent>
          <DialogContentText>{error ? error.message : null}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} variant="outlined">
            Okay
          </Button>
        </DialogActions>
      </Dialog>

      <Grid item={true} xs={false} sm={4} md={7} className={classes.image} />
      <Grid item={true} xs={12} sm={8} md={5} component={Paper} elevation={10} square={true}>
        <div className={classes.paper}>
          <Avatar className={classes.avatar}>
            {login ? <LockOpenOutlineIcon /> : <LockOutlinedIcon />}
          </Avatar>
          <Typography component="h1" variant="h5">
            {login ? "Sign In" : "Register"}
          </Typography>
          <form className={classes.form} noValidate={true}>
            {!login ? (
              <TextField
                variant="outlined"
                margin="normal"
                required={true}
                fullWidth={true}
                label="Name"
                autoComplete="email"
                autoFocus={true}
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                }}
              />
            ) : null}
            <TextField
              variant="outlined"
              margin="normal"
              required={true}
              fullWidth={true}
              label="Email Address"
              autoComplete="email"
              autoFocus={true}
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
              }}
            />
            <TextField
              variant="outlined"
              margin="normal"
              required={true}
              fullWidth={true}
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
              }}
            />
            <Button
              fullWidth={true}
              variant="contained"
              color="primary"
              className={classes.submit}
              onClick={submit}
              disabled={!email || !password || (!login && !name)}
            >
              {login ? "Sign In" : "Register"}
            </Button>
            <Grid container={true} justify="flex-end">
              <Grid item>
                {login ? (
                  <Button variant="text" onClick={toggleLogin} color="primary">
                    Don't have an account? Register
                  </Button>
                ) : null}
              </Grid>
            </Grid>
          </form>
        </div>
      </Grid>
    </Grid>
  );
}
