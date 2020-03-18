import React, {useEffect} from "react";
import PropTypes from "prop-types";
import {
  createMuiTheme, makeStyles,
  ThemeProvider,
  withStyles
} from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";
import Hidden from "@material-ui/core/Hidden";
import Typography from "@material-ui/core/Typography";
import Link from "@material-ui/core/Link";
import Navigator from "./Navigator";
import { Route } from "react-router";
import Courses from "./MyCourses";
import HomeContent from "./MyFiles";
import BrowseContent from "./BrowseContent";
import ViewCourse from "./CoursePage";
import LoginPage from "./LoginPage";
import { Switch, Redirect } from "react-router-dom";
import axios from 'axios';
import Avatar from "@material-ui/core/Avatar";
import LockOutlinedIcon from "@material-ui/icons/LockOutlined";
import TextField from "@material-ui/core/TextField";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import Box from "@material-ui/core/Box";
import Container from "@material-ui/core/Container";

function Copyright() {
  return (
    <Typography variant="body2" color="textSecondary" align="center">
      {"Copyright © "}
      <Link color="inherit" href="https://material-ui.com/">
        Your Website
      </Link>{" "}
      {new Date().getFullYear()}
      {"."}
    </Typography>
  );
}

let theme = createMuiTheme({
  palette: {
    primary: {
      light: "#63ccff",
      main: "#009be5",
      dark: "#006db3"
    }
  },
  typography: {
    h5: {
      fontWeight: 500,
      fontSize: 26,
      letterSpacing: 0.5
    }
  },
  shape: {
    // borderRadius: 8,
  },
  props: {
    MuiTab: {
      disableRipple: true
    }
  },
  mixins: {
    toolbar: {
      minHeight: 48
    }
  }
});

theme = {
  ...theme,
  overrides: {
    MuiDrawer: {
      paper: {
        backgroundColor: "#18202c"
      }
    },
    MuiButton: {
      label: {
        textTransform: "none"
      },
      contained: {
        boxShadow: "none",
        "&:active": {
          boxShadow: "none"
        }
      }
    },
    MuiTabs: {
      root: {
        marginLeft: theme.spacing(1)
      },
      indicator: {
        height: 3,
        borderTopLeftRadius: 3,
        borderTopRightRadius: 3,
        backgroundColor: theme.palette.common.white
      }
    },
    MuiTab: {
      root: {
        textTransform: "none",
        margin: "0 16px",
        minWidth: 0,
        padding: 0,
        [theme.breakpoints.up("md")]: {
          padding: 0,
          minWidth: 0
        }
      }
    },
    MuiIconButton: {
      root: {
        padding: theme.spacing(1)
      }
    },
    MuiTooltip: {
      tooltip: {
        borderRadius: 4
      }
    },
    MuiDivider: {
      root: {
        backgroundColor: "#404854"
      }
    },
    MuiListItemText: {
      primary: {
        fontWeight: theme.typography.fontWeightMedium
      }
    },
    MuiListItemIcon: {
      root: {
        color: "inherit",
        marginRight: 0,
        "& svg": {
          fontSize: 20
        }
      }
    },
    MuiAvatar: {
      root: {
        width: 32,
        height: 32
      }
    }
  }
};

const drawerWidth = 256;

const styles = {
  root: {
    display: "flex",
    minHeight: "100vh"
  },
  drawer: {
    [theme.breakpoints.up("sm")]: {
      width: drawerWidth,
      flexShrink: 0
    }
  },
  app: {
    flex: 1,
    display: "flex",
    flexDirection: "column"
  },
  main: {
    flex: 1,
    padding: theme.spacing(0, 0),
    background: "#eaeff1"
  },
  footer: {
    padding: theme.spacing(2),
    background: "#eaeff1"
  }
};

const useStyles = makeStyles(theme => ({
  paper: {
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main,
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
}));

function Home(props) {
  const { classes} = props;
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [loginStatus, setLoginStatus] = React.useState(true);
  let [workerInfo, setWorker] = React.useState("");

  const classesLogin = useStyles();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  function loginBtn() {
    console.log("clicked")
    setLoginStatus(true)
    axios.get('http://35.224.26.195:4000/worker')
        .then(function (response) {
          console.log(response.data);
          setWorker(response.data.worker.publicIp)
        })
        .catch(function (error) {
          console.log(error);
        });
  }

  useEffect(() => {
    console.log("test")

    async function fetchData() {
      // const response = await axios('http://35.224.26.195:4000/worker');
      // console.log(response.data)
      axios.get('http://35.224.26.195:4000/worker')
          .then(function (response) {
            console.log(response);
            setWorker(response.data.worker)
          })
          .catch(function (error) {
            console.log(error);
          });
    }
    fetchData();
  }, []);

  return (
      loginStatus ?
          <ThemeProvider theme={theme}>
            <div className={classes.root}>
              <CssBaseline />
              <nav className={classes.drawer}>
                <Hidden smUp implementation="js">
                  <Navigator
                      PaperProps={{ style: { width: drawerWidth } }}
                      variant="temporary"
                      open={mobileOpen}
                      onClose={handleDrawerToggle}
                  />
                </Hidden>
                <Hidden xsDown implementation="css">
                  <Navigator PaperProps={{ style: { width: drawerWidth } }} />
                </Hidden>
              </nav>
              <div className={classes.app}>
                {/*<Header onDrawerToggle={handleDrawerToggle} />*/}

                <main className={classes.main}>
                  <Switch>
                    <Redirect exact from="/" to="my-courses" />
                    <Route path={"/my-courses"} render={(props) => <Courses {...props} workerInfo={workerInfo}/>}/>
                    {/*<Route path={"/my-courses"} component={Courses}/>*/}
                    <Route path={"/my-files"} component={HomeContent} />
                    <Route path={"/browse-content"} component={BrowseContent} />
                    <Route path={"/course-page"} component={ViewCourse} />
                  </Switch>
                </main>
                <footer className={classes.footer}>
                  <Copyright />
                </footer>
              </div>
            </div>
          </ThemeProvider>
          :
          // <LoginPage greeting="Welcome to React"/>
          <Container component="main" maxWidth="xs">
            <CssBaseline />
            <div className={classesLogin.paper}>
              <Avatar className={classesLogin.avatar}>
                <LockOutlinedIcon />
              </Avatar>
              <Typography component="h1" variant="h5">
                Sign in
              </Typography>
              <form className={classesLogin.form} noValidate>
                <TextField
                    variant="outlined"
                    margin="normal"
                    // required
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    // autoComplete="email"
                    autoFocus
                />
                <TextField
                    variant="outlined"
                    margin="normal"
                    // required
                    fullWidth
                    name="password"
                    label="Password"
                    // type="password"
                    id="password"
                    autoComplete="current-password"
                />
                {/*<FormControlLabel*/}
                {/*    control={<Checkbox value="remember" color="primary" />}*/}
                {/*    label="Remember me"*/}
                {/*/>*/}
                <Button
                    // type="submit"
                    fullWidth
                    variant="contained"
                    color="primary"
                    className={classes.submit}
                    onClick={() => loginBtn()}
                >
                  Sign In
                </Button>
              </form>
            </div>
          </Container>
  );
}

Home.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(Home);
