import React from "react";
import PropTypes from "prop-types";
import AppBar from "@material-ui/core/AppBar";
import Avatar from "@material-ui/core/Avatar";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import { withStyles } from "@material-ui/core/styles";
import { GlobalContext } from "./GlobalContext";

const styles = (theme) => ({
  appBar: {
    zIndex: 0,
  },
  toolBar: {
    borderRadius: 0,
    minHeight: "60px",
    userSelect: "none",
  },
  iconButtonAvatar: {
    padding: 4,
  },
});

class Header extends React.Component {
  static contextType = GlobalContext;

  render() {
    const { classes, title } = this.props;
    const { workerInfo, user } = this.context;

    const workerText =
      workerInfo !== null && workerInfo !== undefined
        ? `Connected to ${workerInfo.id}`
        : "Trying to connect to worker";

    return (
      <AppBar
        component="div"
        className={classes.appBar}
        color="primary"
        position="static"
        elevation={15}
      >
        <Toolbar className={classes.toolBar}>
          <Grid container alignItems="center" spacing={1}>
            <Grid item xs>
              <Typography color="inherit" variant="h5" component="h1">
                {/*Title gets passed in via props*/}
                {title}
              </Typography>
            </Grid>
            <Grid item>
              <Typography color="inherit">
                {/*Display which worker we're connected to for demo purposes*/}
                {workerText}
              </Typography>
            </Grid>
            <Grid item>
              <IconButton className={classes.iconButtonAvatar} disabled={true}>
                {/*Sets the avatar icon as the first letter of the users name*/}
                <Avatar>{!!user.name && user.name.length > 0 ? user.name[0] : "X"}</Avatar>
              </IconButton>
            </Grid>
          </Grid>
        </Toolbar>
      </AppBar>
    );
  }
}

Header.propTypes = {
  title: PropTypes.string.isRequired,
};

export default withStyles(styles)(Header);
