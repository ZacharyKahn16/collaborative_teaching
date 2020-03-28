import React from "react";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import TextField from "@material-ui/core/TextField";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from "@material-ui/core/IconButton";
import { withStyles } from "@material-ui/core/styles";
import SearchIcon from "@material-ui/icons/Search";
import RefreshIcon from "@material-ui/icons/Refresh";
import Header from "./Header";
import ContentBank from "./ContentBank";
import { GlobalContext } from "./GlobalContext";

const styles = (theme) => ({
  paper: {
    margin: "auto",
    maxHeight: "100vh",
    overflowX: "hidden",
    overflowY: "auto",
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

class BrowseContent extends React.Component {
  static contextType = GlobalContext;

  constructor(props) {
    super(props);

    this.handleSearchOnChange = this.handleSearchOnChange.bind(this);
  }

  handleSearchOnChange(e) {
    console.log(e.key);
    if (e.key === "Enter") {
      console.log(e.target.value);
    }
  }

  render() {
    const { classes } = this.props;

    return (
      <Paper className={classes.paper} square>
        <Header title={"Content Bank"} />
        <AppBar className={classes.searchBar} position="static" color="default" elevation={0}>
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
          {/*No users for this project yet*/}
          <ContentBank />
        </div>
      </Paper>
    );
  }
}

export default withStyles(styles)(BrowseContent);
