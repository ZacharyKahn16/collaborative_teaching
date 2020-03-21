import React from "react";
import PropTypes from "prop-types";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
// import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from "@material-ui/core/IconButton";
import { withStyles } from "@material-ui/core/styles";
import SearchIcon from "@material-ui/icons/Search";
import RefreshIcon from "@material-ui/icons/Refresh";
import Header from "./Header";
import PublishIcon from "@material-ui/icons/Publish";
import FileList from "./FileList";
import UploadCard from "./UploadCard";
import Modal from "@material-ui/core/Modal";
import Backdrop from "@material-ui/core/Backdrop";
import Fade from "@material-ui/core/Fade";

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
  },
  addFileButton: {
    marginRight: "5px"
  }
});

class MyFiles extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      mobileOpen: false,
      uploadModalOpen: false,
    };

    this.handleOpenUploadModal = this.handleOpenUploadModal.bind(this);
    this.handleCloseUploadModal = this.handleCloseUploadModal.bind(this);
  }

  handleDrawerToggle() {
    this.setState({
      mobileOpen: !this.state.mobileOpen
    });
  };

  handleOpenUploadModal() {
    this.setState(() => ({
      uploadModalOpen: true
    }));
  };

  handleCloseUploadModal() {
    this.setState(() => ({
      uploadModalOpen: false
    }));
  };

  componentDidMount() {
    // console.log("mounted")
  }
  render() {
    const { classes, workerInfo } = this.props;
    return(
        <Paper className={classes.paper}>
          <Header onDrawerToggle={this.handleDrawerToggle} setTitle={{name:"My Files"}} setWorkerDis={{name: workerInfo}} />
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
                      placeholder="Search by course or file name."
                      InputProps={{
                        disableUnderline: true,
                        className: classes.searchInput
                      }}
                  />
                </Grid>
                <Grid item>
                  <Button variant="contained" color="primary" className={classes.addUser} onClick={this.handleOpenUploadModal}>
                    <PublishIcon className={classes.addFileButton} color="inherit"/>
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
              <Modal
                  aria-labelledby="transition-modal-title"
                  aria-describedby="transition-modal-description"
                  className="modal"
                  open={this.state.uploadModalOpen}
                  onClose={this.handleCloseUploadModal}
                  closeAfterTransition
                  BackdropComponent={Backdrop}
                  BackdropProps={{
                    timeout: 500,
                    style: {backgroundColor: 'rgba(0,0,0,0.7)'}
                  }}
              >
                <Fade in={this.state.uploadModalOpen}>
                  <UploadCard closeModal={this.handleCloseUploadModal}/>
                </Fade>
              </Modal>
            </Toolbar>
          </AppBar>
          <div className={classes.contentWrapper}>
            <FileList />
          </div>
        </Paper>
    );
  }
}



MyFiles.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(MyFiles);
