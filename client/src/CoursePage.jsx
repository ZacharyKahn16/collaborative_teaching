import React from "react";
import PropTypes from "prop-types";
import {
  AppBar,
  Toolbar,
  Paper,
  Grid,
  TextField,
  IconButton,
  withStyles,
  Tooltip,
  Button,
  Dialog,
} from "@material-ui/core";
import SearchIcon from "@material-ui/icons/Search";
import RefreshIcon from "@material-ui/icons/Refresh";
import PublishIcon from "@material-ui/icons/Publish";
import Header from "./Header";
import FileList from "./FileList";

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

class CoursePage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      uploadModalOpen: false,
    };

    this.handleOpenUploadModal = this.handleOpenUploadModal.bind(this);
  }

  handleOpenUploadModal() {
    this.setState({
      uploadModalOpen: true,
    });
  }

  handleCloseUploadModal() {
    this.setState({
      uploadModalOpen: false,
    });
  }

  componentDidMount() {
    // console.log("mounted")
  }

  render() {
    const { classes } = this.props;

    return (
      <Paper className={classes.paper} square>
        <Header title={"List of Courses"} />
        <AppBar className={classes.searchBar} position="static" color="default" elevation={0}>
          <Toolbar>
            <Grid container spacing={2} alignItems="center">
              <Grid item>
                <SearchIcon className={classes.block} color="inherit" />
              </Grid>
              <Grid item xs>
                <TextField
                  fullWidth
                  placeholder="Search by course or file name."
                  InputProps={{
                    disableUnderline: true,
                    className: classes.searchInput,
                  }}
                />
              </Grid>
              <Grid item>
                <Button
                  variant="contained"
                  color="primary"
                  className={classes.addUser}
                  onClick={this.handleOpenUploadModal}
                >
                  <PublishIcon className={classes.addFileButton} color="inherit" />
                  Add file
                  <input type="file" style={{ display: "none" }} />
                </Button>
                <Tooltip title="Reload">
                  <IconButton>
                    <RefreshIcon className={classes.block} color="inherit" />
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>
            <Dialog open={this.state.uploadModalOpen} onClose={this.handleCloseUploadModal}>
              <div>{/*TODO: Conditional card for either editing or deleting*/}</div>
            </Dialog>
          </Toolbar>
        </AppBar>
        <div className={classes.contentWrapper}>
          <FileList />
        </div>
      </Paper>
    );
  }
}

CoursePage.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(CoursePage);
