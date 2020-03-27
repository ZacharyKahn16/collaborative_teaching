import React from "react";
import { createMuiTheme, ThemeProvider, withStyles } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";
import Navigator from "./Navigator";
import { Route } from "react-router";
import Courses from "./MyCourses";
import MyFiles from "./MyFiles";
import BrowseContent from "./BrowseContent";
import ViewCourse from "./CoursePage";
import LoadingScreen from "./LoadingScreen";
import { Switch, Redirect } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import { MASTER_STATIC_IPS, WORKER_SOCKET_PORT } from "./ServerConfig";
import { UserContext } from "./UserContext";

let theme = createMuiTheme({
  palette: {
    primary: {
      light: "#63ccff",
      main: "#009be5",
      dark: "#006db3",
    },
  },
  typography: {
    h5: {
      fontWeight: 500,
      fontSize: 26,
      letterSpacing: 0.5,
    },
  },
  props: {
    MuiTab: {
      disableRipple: true,
    },
  },
  mixins: {
    toolbar: {
      minHeight: 48,
    },
  },
});

theme = {
  ...theme,
  overrides: {
    MuiDrawer: {
      paper: {
        backgroundColor: "#18202c",
      },
    },
    MuiButton: {
      label: {
        textTransform: "none",
      },
      contained: {
        boxShadow: "none",
        "&:active": {
          boxShadow: "none",
        },
      },
    },
    MuiTabs: {
      root: {
        marginLeft: theme.spacing(1),
      },
      indicator: {
        height: 3,
        borderTopLeftRadius: 3,
        borderTopRightRadius: 3,
        backgroundColor: theme.palette.common.white,
      },
    },
    MuiTab: {
      root: {
        textTransform: "none",
        margin: "0 16px",
        minWidth: 0,
        padding: 0,
        [theme.breakpoints.up("md")]: {
          padding: 0,
          minWidth: 0,
        },
      },
    },
    MuiIconButton: {
      root: {
        padding: theme.spacing(1),
      },
    },
    MuiTooltip: {
      tooltip: {
        borderRadius: 4,
      },
    },
    MuiDivider: {
      root: {
        backgroundColor: "#404854",
      },
    },
    MuiListItemText: {
      primary: {
        fontWeight: theme.typography.fontWeightMedium,
      },
    },
    MuiListItemIcon: {
      root: {
        color: "inherit",
        marginRight: 0,
        "& svg": {
          fontSize: 20,
        },
      },
    },
    MuiAvatar: {
      root: {
        width: 32,
        height: 32,
      },
    },
  },
};

const drawerWidth = 250;

const styles = {
  root: {
    display: "flex",
    minHeight: "100vh",
  },
  drawer: {
    [theme.breakpoints.up("sm")]: {
      width: drawerWidth,
      flexShrink: 0,
    },
  },
  app: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  main: {
    flex: 1,
    padding: theme.spacing(0, 0),
    background: "#eaeff1",
  },
  footer: {
    padding: theme.spacing(2),
    background: "#eaeff1",
  },
};

function backOffForRetry(retryNum) {
  // Exp between 9 and 18 (corresponds to 512 ms to 262144 ms)
  const exp = Math.min(retryNum + 9, 18);
  const nominalDelay = 2 ** exp;
  return nominalDelay * (Math.random() + 0.5);
}

class Home extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);

    this.state = {
      workerInfo: "",
      isLoaded: false,
      connectionAttempts: 0,
      socket: null,
    };

    // this.handleChange = this.handleChange.bind(this);
    // this.handleSubmit = this.handleSubmit.bind(this);
    this.connectMaster = this.connectMaster.bind(this);
    this.connectWorker = this.connectWorker.bind(this);
  }

  componentDidMount() {
    this.connectMaster(MASTER_STATIC_IPS[0], MASTER_STATIC_IPS[1]);
  }

  connectMaster(ipOne, ipTwo) {
    console.log("trying to connect to master, attempt", this.state.connectionAttempts);

    axios
      .get(ipOne)
      .then((result) => {
        if (!result.data.worker) {
          this.setState({
            isLoaded: false,
            connectionAttempts: this.state.connectionAttempts + 1,
          });

          setTimeout(() => {
            this.connectMaster(ipTwo, ipOne);
          }, backOffForRetry(this.state.connectionAttempts));
        } else {
          console.log("got worker from master", result.data.worker);
          this.connectWorker(result.data.worker);
        }
      })
      .catch((error) => {
        console.error("master connection error", error);
        this.setState({
          isLoaded: false,
          connectionAttempts: this.state.connectionAttempts + 1,
        });

        setTimeout(() => {
          this.connectMaster(ipTwo, ipOne);
        }, backOffForRetry(this.state.connectionAttempts));
      });
  }

  connectWorker(worker) {
    const socket = io(`http://${worker.publicIp}:${WORKER_SOCKET_PORT}`);
    console.log(socket);

    socket.on("connect", () => {
      console.log("connected to worker", worker);
      this.setState({
        isLoaded: true,
        workerInfo: worker,
        socket: socket,
      });
    });

    socket.on("disconnect", () => {
      console.log("disconnected from worker", worker);
      socket.close();

      this.setState({
        isLoaded: false,
        workerInfo: "",
        socket: null,
      });

      this.connectMaster(MASTER_STATIC_IPS[0], MASTER_STATIC_IPS[1]);
    });
  }

  render() {
    if (!this.state.isLoaded) {
      return <LoadingScreen />;
    }

    return (
      <ThemeProvider theme={theme}>
        <div className={this.props.classes.root}>
          <CssBaseline />
          <nav className={this.props.classes.drawer}>
            <Navigator PaperProps={{ style: { width: drawerWidth } }} />
          </nav>
          <div className={this.props.classes.app}>
            <main className={this.props.classes.main}>
              <Switch>
                <Redirect exact from="/" to="my-courses" />
                <Route
                  exact
                  path={"/my-courses"}
                  render={(props) => (
                    <Courses
                      {...props}
                      socket={this.state.socket}
                      workerInfo={this.state.workerInfo}
                    />
                  )}
                />
                {/*<Route path={"/my-courses"} component={Courses}/>*/}
                <Route
                  path={"/my-files"}
                  render={(props) => (
                    <MyFiles
                      {...props}
                      workerInfo={this.state.workerInfo}
                      socket={this.state.socket}
                    />
                  )}
                />
                {/*<Route path={"/my-files"} component={MyFiles}/>*/}
                <Route
                  path={"/browse-content"}
                  render={(props) => (
                    <BrowseContent
                      {...props}
                      workerInfo={this.state.workerInfo}
                      socket={this.state.socket}
                    />
                  )}
                />
                {/*<Route path={"/browse-content"} component={BrowseContent}/>*/}
                <Route
                  path={"/course-page/"}
                  render={(props) => <ViewCourse {...props} workerInfo={"this.state.workerInfo"} />}
                />
              </Switch>
            </main>
          </div>
        </div>
      </ThemeProvider>
    );
  }
}

export default withStyles(styles)(Home);
