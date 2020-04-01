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
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Link,
  TableContainer,
} from "@material-ui/core";
import SearchIcon from "@material-ui/icons/Search";
import RefreshIcon from "@material-ui/icons/Refresh";
import PublishIcon from "@material-ui/icons/Publish";
import Header from "./Header";
import FileList from "./FileList";
import UploadCard from "./UploadCard";
import { GlobalContext } from "./GlobalContext";
import moment from "moment-timezone";
import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from "@material-ui/icons/Delete";
import AddIcon from "@material-ui/icons/Add";
import Avatar from "@material-ui/core/Avatar";
import UpdateCard from "./UpdateCard";
import DeleteCard from "./DeleteCard";
import AddToCourseCard from "./AddToCourseCard";

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
      editModalOpen: false,
      deleteModalOpen: false,
      addToCourseModalOpen: false,
      selectedFile: null,
    };

    this.handleOpenUploadModal = this.handleOpenUploadModal.bind(this);
    this.handleCloseUploadModal = this.handleCloseUploadModal.bind(this);
    this.updateSearchTerm = this.updateSearchTerm.bind(this);
    this.handleEditModalOpen = this.handleEditModalOpen.bind(this);
    this.handleDeleteModalOpen = this.handleDeleteModalOpen.bind(this);
    this.handleAddToCourseModalOpen = this.handleAddToCourseModalOpen.bind(this);
    this.handleModalClose = this.handleModalClose.bind(this);
    this.updateSelectedFile = this.updateSelectedFile.bind(this);
    this.getCourseNamesFromId = this.getCourseNamesFromId.bind(this);
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

  handleEditModalOpen = (file) => {
    this.setState(() => ({
      selectedFile: file,
      editModalOpen: true,
    }));
  };

  handleDeleteModalOpen = (file) => {
    this.setState(() => ({
      selectedFile: file,
      deleteModalOpen: true,
    }));
  };

  handleAddToCourseModalOpen = (file) => {
    this.setState(() => ({
      selectedFile: file,
      addToCourseModalOpen: true,
    }));
  };

  handleModalClose = () => {
    this.setState(() => ({
      editModalOpen: false,
      deleteModalOpen: false,
      addToCourseModalOpen: false,
    }));
  };

  updateSelectedFile = (fileId) => {
    const { setSelectedFileId } = this.context;

    setSelectedFileId(fileId);
  };

  getCourseNamesFromId = (courseIds) => {
    const { allCourses } = this.context;
    if (courseIds.length === 0) {
      return "Not part of any courses";
    }
    return allCourses
      .filter((course) => {
        return courseIds.includes(course.docId);
      })
      .map((course) => {
        return course.courseName;
      })
      .join(", ");
  };

  render() {
    const { allFiles, user, allCourses } = this.context;
    const { classes } = this.props;

    const files = allFiles
      .filter((file) => {
        return user.uid === file.ownerId;
      })
      .filter((file) => {
        return (
          file.name.includes(this.state.searchTerm) ||
          file.ownerName.includes(this.state.searchTerm) ||
          file.courseIds.includes(this.state.searchTerm)
        );
      })
      .sort((a, b) => {
        return b.lastUpdated - a.lastUpdated;
      });

    const myCourses = allCourses
      .filter((course) => {
        return course.ownerId === user.uid;
      })
      .sort((a, b) => {
        return a.courseName.localeCompare(b.courseName);
      });

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
          {/*<FileList searchTerm={this.state.searchTerm} />*/}
          {files.length === 0 ? (
            <Typography color="textSecondary" align="center">
              No files available
            </Typography>
          ) : (
            <TableContainer>
              <Table aria-label="simple table">
                <TableHead>
                  <TableRow className="bold">
                    <TableCell className="bold" align="left">
                      File Name
                    </TableCell>
                    <TableCell className="bold" align="left">
                      Courses
                    </TableCell>
                    <TableCell className="bold" align="left">
                      File Type
                    </TableCell>
                    <TableCell className="bold" align="left">
                      Last Updated
                    </TableCell>
                    <TableCell className="bold" align="center">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {files.map((row) => (
                    <TableRow key={row.docId}>
                      <TableCell align="left">
                        <Typography variant="body2">
                          <Link
                            color="primary"
                            href="#"
                            onClick={() => {
                              this.updateSelectedFile(row.docId);
                            }}
                          >
                            {row.name}
                          </Link>
                        </Typography>
                      </TableCell>
                      {/*<TableCell align="left">{row.docId}</TableCell>*/}
                      <TableCell align="left">
                        {row.courseIds.length <= 1 ? (
                          this.getCourseNamesFromId(row.courseIds)
                        ) : (
                          <Tooltip title={this.getCourseNamesFromId(row.courseIds)}>
                            <Avatar color={"inherit"}>{row.courseIds.length}</Avatar>
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell align="left">
                        {row.name.split(".")[row.name.split(".").length - 1].toUpperCase()}
                      </TableCell>
                      <TableCell align="left">{moment(row.lastUpdated).format("lll")}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Edit file">
                          <IconButton
                            className="action-button"
                            onClick={() => this.handleEditModalOpen(row)}
                          >
                            <EditIcon color="inherit" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete file">
                          <IconButton
                            className="action-button"
                            onClick={() => this.handleDeleteModalOpen(row)}
                          >
                            <DeleteIcon color="inherit" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={"Add file to course"}>
                          <IconButton
                            className="action-button"
                            onClick={() => this.handleAddToCourseModalOpen(row)}
                          >
                            <AddIcon color={"inherit"} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Dialog open={this.state.editModalOpen} onClose={this.handleModalClose}>
                <UpdateCard
                  closeModal={this.handleModalClose}
                  socket={this.props.socket}
                  fileInfo={this.state.selectedFile}
                />
              </Dialog>
              <Dialog open={this.state.deleteModalOpen} onClose={this.handleModalClose}>
                <DeleteCard
                  closeModal={this.handleModalClose}
                  socket={this.props.socket}
                  fileInfo={this.state.selectedFile}
                />
              </Dialog>
              <Dialog open={this.state.addToCourseModalOpen} onClose={this.handleModalClose}>
                <AddToCourseCard
                  closeModal={this.handleModalClose}
                  socket={this.props.socket}
                  fileInfo={this.state.selectedFile}
                  courseInfo={myCourses}
                />
              </Dialog>
            </TableContainer>
          )}
        </div>
      </Paper>
    );
  }
}

export default withStyles(styles)(MyFiles);
