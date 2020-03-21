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
import LoadingScreen from "./LoadingScreen";
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
import io from "socket.io-client";

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


class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      mobileOpen: false,
      loginStatus: true,
      workerInfo: "",
      isLoaded: false,
      error: null
    };
    // this.handleChange = this.handleChange.bind(this);
    // this.handleSubmit = this.handleSubmit.bind(this);
    this.handleDrawerToggle = this.handleDrawerToggle.bind(this);


  }

  componentDidMount() {
    axios.get("http://35.224.26.195:4000/worker")
        .then(
            (result) => {
              this.setState({
                isLoaded: true,
                workerInfo: result.data.worker
              });
              console.log(result)
              const socket = io("http://"+ result.data.worker.publicIp +":4001");
              socket.on(
                  "connect", () => {console.log("connected")}
              );
              // Send worker a request to write a file into the FDB
              // socket.emit("Insert File", {
              //   fileName: "Test-File.txt",
              //   fileContents: "Hello World 1",
              //   fileHash: "XXXXXXXX",
              //   fileType: "String"
              // });

              // Retrieving file
              // socket.emit("Retrieve File", {
              //   fileName: '04d9a6bb-2167-41ed-8bb8-f00d3dfb42e9' // some id
              // })

              // Database List

              // Listen to worker responses here
              socket.on("Server Response", function(msg) {
                console.log(msg);
              });
            },
            (error) => {
              this.setState({
                isLoaded: true,
                error
              });
              console.log(error)
            }
        )
  }

  handleDrawerToggle = () => {
    this.state.mobileOpen = !this.state.mobileOpen
  };


  render() {
    const isLoaded = this.state.isLoaded;
    if (isLoaded != true) {
      // return <div>Loading...</div>;
      return <LoadingScreen/>
    } else {
      console.log(this.state.workerInfo)
      return (
          this.state.loginStatus ?
              <ThemeProvider theme={theme}>
                <div className={this.props.classes.root}>
                  <CssBaseline/>
                  <nav className={this.props.classes.drawer}>
                    <Hidden smUp implementation="js">
                      <Navigator
                          PaperProps={{style: {width: drawerWidth}}}
                          variant="temporary"
                          open={this.state.mobileOpen}
                          onClose={this.handleDrawerToggle}
                      />
                    </Hidden>
                    <Hidden xsDown implementation="css">
                      <Navigator PaperProps={{style: {width: drawerWidth}}}/>
                    </Hidden>
                  </nav>
                  <div className={this.props.classes.app}>
                    {/*<Header onDrawerToggle={handleDrawerToggle} />*/}

                    <main className={this.props.classes.main}>
                      <Switch>
                        <Redirect exact from="/" to="my-courses"/>
                        <Route exact path={"/my-courses"} render={(props) => <Courses {...props} workerInfo={this.state.workerInfo}/>}/>
                        {/*<Route path={"/my-courses"} component={Courses}/>*/}
                        <Route path={"/my-files"} render={(props) => <HomeContent {...props} workerInfo={this.state.workerInfo}/>}/>
                        {/*<Route path={"/my-files"} component={HomeContent}/>*/}
                        <Route path={"/browse-content"} render={(props) => <BrowseContent {...props} workerInfo={this.state.workerInfo}/>}/>
                        {/*<Route path={"/browse-content"} component={BrowseContent}/>*/}
                        <Route path={"/course-page/"} render={(props) => <ViewCourse {...props} workerInfo={"this.state.workerInfo"}/>}/>
                      </Switch>
                    </main>
                    <footer className={this.props.classes.footer}>
                      <Copyright/>
                    </footer>
                  </div>
                </div>
              </ThemeProvider>
              :
              <LoginPage greeting="Welcome to React"/>
      )
    }
  }
}

// Home.propTypes = {
//   classes: PropTypes.object.isRequired
// };

export default withStyles(styles)(Home);
