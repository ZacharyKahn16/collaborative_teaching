import React from "react";
import AppBar from "@material-ui/core/AppBar";
import Avatar from "@material-ui/core/Avatar";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import { withStyles } from "@material-ui/core/styles";

const styles = theme => ({
  appBar: {
    zIndex: 0
  },
  toolBar: {
    borderRadius: 0,
    minHeight: "60px",
    userSelect: "none"
  },
  iconButtonAvatar: {
    padding: 4
  }
});

class Header extends React.Component {
  render() {
    const { classes, title, workerInfo, userInfo } = this.props;

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
                {title}
              </Typography>
            </Grid>
            <Grid item>
              <Typography color="inherit">
                Connected to {workerInfo.id}
              </Typography>
            </Grid>
            <Grid item>
              <IconButton className={classes.iconButtonAvatar} disabled={true}>
                <Avatar src="/static/images/avatar/1.jpg" alt={userInfo.name} />
              </IconButton>
            </Grid>
          </Grid>
        </Toolbar>
      </AppBar>
    );
  }
}

export default withStyles(styles)(Header);
