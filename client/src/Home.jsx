import React from "react";
import { withStyles } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";
import { Switch, Redirect } from "react-router-dom";
import { Route } from "react-router";
import Navigator from "./Navigator";
import Courses from "./MyCourses";
import MyFiles from "./MyFiles";
import BrowseContent from "./BrowseContent";
import ViewCourse from "./CoursePage";
import LoadingScreen from "./LoadingScreen";
import { GlobalContext } from "./GlobalContext";
import FileViewModal from "./FileViewModal";
import NotificationPopup from "./Notification";

const drawerWidth = 250;

const styles = (theme) => ({
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
});

class Home extends React.Component {
  static contextType = GlobalContext;

  render() {
    const { isLoaded, user, workerInfo } = this.context;

    if (!isLoaded || !user || !workerInfo || !workerInfo.publicIp) {
      return <LoadingScreen />;
    }

    return (
      <div className={this.props.classes.root}>
        <CssBaseline />
        <NotificationPopup />
        <FileViewModal />
        <nav className={this.props.classes.drawer}>
          <Navigator PaperProps={{ style: { width: drawerWidth } }} />
        </nav>
        <div className={this.props.classes.app}>
          <main className={this.props.classes.main}>
            <Switch>
              <Route exact path={"/courses"} render={(props) => <Courses />} />
              <Route exact path={"/my-files"} render={(props) => <MyFiles />} />
              <Route exact path={"/content-bank"} render={(props) => <BrowseContent />} />
              <Route path={"/course-page/"} render={(props) => <ViewCourse {...props} />} />
              <Redirect to="courses" />
            </Switch>
          </main>
        </div>
      </div>
    );
  }
}

export default withStyles(styles)(Home);
