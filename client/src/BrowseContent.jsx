import React from "react";
import PropTypes from "prop-types";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
// import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from "@material-ui/core/IconButton";
import { withStyles } from "@material-ui/core/styles";
import SearchIcon from "@material-ui/icons/Search";
import RefreshIcon from "@material-ui/icons/Refresh";
import Header from "./Header";

const styles = theme => ({
  paper: {
    // maxWidth: 936,
    margin: "auto",
    overflow: "hidden"
  },
  searchBar: {
    borderBottom: "1px solid rgba(0, 0, 0, 0.12)"
  },
  searchInput: {
    fontSize: theme.typography.fontSize
  },
  block: {
    display: "block"
  },
  addUser: {
    marginRight: theme.spacing(1)
  },
  contentWrapper: {
    margin: "40px 16px"
  }
});

const listOfFiles = [
  {
    filename: "book",
    author: "daniel"
  },
  {
    filename: "book2",
    author: "john"
  },
  {
    filename: "book3",
    author: "mike"
  }
];

function MyCourses(props) {
  const { classes } = props;
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  function handleSearchOnChange(e) {
    // if (e.target.value
    console.log(e.key);
    if (e.key === "Enter") {
      console.log(e.target.value);
    }
  }

  return (
    <Paper className={classes.paper}>
      <Header
        onDrawerToggle={handleDrawerToggle}
        setTitle={"Content Bank"}
      />
      <AppBar
        className={classes.searchBar}
        position="static"
        color="default"
        elevation={0}
      >
        <Toolbar>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <SearchIcon className={classes.block} color="inherit" />
            </Grid>
            <Grid item xs>
              <TextField
                fullWidth
                placeholder="Search by author or file name"
                InputProps={{
                  disableUnderline: true,
                  className: classes.searchInput
                }}
                onKeyDown={handleSearchOnChange}
              />
            </Grid>
            <Grid item>
              {/*<Button variant="contained" color="primary" className={classes.addUser}>*/}
              {/*    Add user*/}
              {/*</Button>*/}
              <Tooltip title="Reload">
                <IconButton>
                  <RefreshIcon className={classes.block} color="inherit" />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </Toolbar>
      </AppBar>
      <div className={classes.contentWrapper}>
        <Typography color="textSecondary" align="center">
          No users for this project yet
        </Typography>
      </div>
    </Paper>
  );
}

MyCourses.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(MyCourses);
