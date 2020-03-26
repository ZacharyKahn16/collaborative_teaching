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
import ContentBank from "./ContentBank";
import FileList from "./FileList";
import LoadingScreen from "./LoadingScreen";

const styles = (theme) => ({
  paper: {
    // maxWidth: 936,
    margin: "auto",
    overflow: "hidden",
  },
  searchBar: {
    borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
  },
  searchInput: {
    fontSize: theme.typography.fontSize,
  },
  block: {
    display: "block",
  },
  addUser: {
    marginRight: theme.spacing(1),
  },
  contentWrapper: {
    margin: "40px 16px",
  },
});

const listOfFiles = [
  {
    filename: "book",
    author: "daniel",
  },
  {
    filename: "book2",
    author: "john",
  },
  {
    filename: "book3",
    author: "mike",
  },
];

class BrowseContent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      mobileOpen: false,
    };

    this.handleSearchOnChange = this.handleSearchOnChange.bind(this);
  }

  handleDrawerToggle() {
    this.setState({
      mobileOpen: !this.state.mobileOpen,
    });
  }

  handleSearchOnChange(e) {
    // if (e.target.value
    console.log(e.key);
    if (e.key === "Enter") {
      console.log(e.target.value);
    }
  }

  render() {
    const { classes, workerInfo, socket, userName } = this.props;
    if (socket === null) {
      return <LoadingScreen />;
    }
    return (
      <Paper className={classes.paper}>
        <Header
          onDrawerToggle={this.handleDrawerToggle}
          setTitle={{ name: "Content Bank" }}
          setWorkerDis={{ name: workerInfo.id }}
          setUsername={{ name: userName }}
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
                  placeholder="Search by author, course or file name."
                  InputProps={{
                    disableUnderline: true,
                    className: classes.searchInput,
                  }}
                  onKeyDown={this.handleSearchOnChange}
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
            {/*No users for this project yet*/}
            <ContentBank socket={socket} />
          </Typography>
        </div>
      </Paper>
    );
  }
}

BrowseContent.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(BrowseContent);
