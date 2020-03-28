import React from "react";
import {
  AppBar,
  Toolbar,
  Paper,
  Grid,
  Button,
  TextField,
  Tooltip,
  IconButton,
  withStyles,
  Dialog,
} from "@material-ui/core";
import SearchIcon from "@material-ui/icons/Search";
import RefreshIcon from "@material-ui/icons/Refresh";
import PublishIcon from "@material-ui/icons/Publish";
import Header from "./Header";
import FileList from "./FileList";
import UploadCard from "./UploadCard";
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
    margin: "20px 15px 40px 15px",
  },
  addFileButton: {
    marginRight: "5px",
  },
});

class MyFiles extends React.Component {
  static contextType = GlobalContext;

  constructor(props) {
    super(props);
    this.state = {
      searchTerm: "",
      uploadModalOpen: false,
    };

    this.handleOpenUploadModal = this.handleOpenUploadModal.bind(this);
    this.handleCloseUploadModal = this.handleCloseUploadModal.bind(this);
    this.updateSearchTerm = this.updateSearchTerm.bind(this);
  }

  updateSearchTerm(event) {
    this.setState({
      searchTerm: event.target.value,
    });
  }

  handleOpenUploadModal() {
    this.setState(() => ({
      uploadModalOpen: true,
    }));
  }

  handleCloseUploadModal() {
    this.setState(() => ({
      uploadModalOpen: false,
    }));
  }

  render() {
    const { classes } = this.props;

    return (
      <Paper className={classes.paper} square={true}>
        <Header title={"My Files"} />
        <AppBar className={classes.searchBar} position="static" color="default" elevation={0}>
          <Toolbar>
            <Grid container spacing={2} alignItems="center">
              <Grid item>
                <SearchIcon className={classes.block} color="inherit" />
              </Grid>
              <Grid item xs>
                <TextField
                  fullWidth={true}
                  placeholder="Search by course or file name."
                  onChange={this.updateSearchTerm}
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
              <UploadCard closeModal={this.handleCloseUploadModal} />
            </Dialog>
          </Toolbar>
        </AppBar>
        <div className={classes.contentWrapper}>
          <FileList searchTerm={this.state.searchTerm} />
        </div>
      </Paper>
    );
  }
}

export default withStyles(styles)(MyFiles);
