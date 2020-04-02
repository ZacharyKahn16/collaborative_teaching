import React from "react";
import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";
import {
  AppBar,
  Dialog,
  Grid,
  IconButton,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Toolbar,
  Typography,
  withStyles,
} from "@material-ui/core";
import SearchIcon from "@material-ui/icons/Search";
import Header from "./Header";
import { GlobalContext } from "./GlobalContext";
import moment from "moment-timezone";
import DeleteIcon from "@material-ui/icons/Delete";
import AddIcon from "@material-ui/icons/Add";
import UpdateCard from "./UpdateCard";
import DeleteFromCourseCard from "./DeleteFromCourseCard";
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
    margin: "40px 16px",
  },
});

class CoursePage extends React.Component {
  static contextType = GlobalContext;

  constructor(props) {
    super(props);
    this.state = {
      uploadModalOpen: false,
      editModalOpen: false,
      deleteModalOpen: false,
      addToCourseModalOpen: false,
    };

    this.handleOpenUploadModal = this.handleOpenUploadModal.bind(this);
    this.updateSelectedFile = this.updateSelectedFile.bind(this);
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

  getCourseFromPath = () => {
    const { location } = this.props;
    const { allCourses } = this.context;
    const courseId = location.pathname.split("/")[2];

    return allCourses.find((c) => {
      return c.docId === courseId;
    });
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

    const course = this.getCourseFromPath();

    if (!course) {
      window.open(window.location.origin, "_self");
    }

    const files = allFiles
      .filter((file) => {
        return file.courseIds.includes(course.docId);
      })
      .sort((a, b) => {
        return b.lastUpdated - a.lastUpdated;
      });

    const myCourses = allCourses
      .filter((selCourse) => {
        return selCourse.ownerId === user.uid;
      })
      .sort((a, b) => {
        return a.courseName.localeCompare(b.courseName);
      });

    return (
      <Paper className={classes.paper} square>
        <Header title={course.courseName} />
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
            </Grid>
            <Dialog open={this.state.uploadModalOpen} onClose={this.handleCloseUploadModal}>
              <div>{/*TODO: Conditional card for either editing or deleting*/}</div>
            </Dialog>
          </Toolbar>
        </AppBar>
        <div className={classes.contentWrapper}>
          <TableContainer>
            <Table aria-label="simple table">
              <TableHead>
                <TableRow className="bold">
                  <TableCell className="bold" align="left">
                    File Name
                  </TableCell>
                  <TableCell className="bold" align="left">
                    File Type
                  </TableCell>
                  <TableCell className="bold" align="left">
                    Owner
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
                  <TableRow key={row.docId} className="file-row">
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
                    <TableCell align="left">
                      {row.name.split(".")[row.name.split(".").length - 1].toUpperCase()}
                    </TableCell>
                    <TableCell align="left">{row.ownerName}</TableCell>
                    <TableCell align="left">{moment(row.lastUpdated).format("lll")}</TableCell>
                    {row.ownerId === user.uid && course.ownerId === user.uid ? (
                      <TableCell align="center">
                        <IconButton
                          className="action-button"
                          onClick={() => this.handleDeleteModalOpen(row)}
                        >
                          <DeleteIcon color="inherit" />
                        </IconButton>
                        <IconButton
                          className="action-button"
                          onClick={() => this.handleAddToCourseModalOpen(row)}
                        >
                          <AddIcon color="inherit" />
                        </IconButton>
                      </TableCell>
                    ) : (
                      <TableCell align="center">
                        <IconButton
                          className="action-button"
                          onClick={() => this.handleAddToCourseModalOpen(row)}
                        >
                          <AddIcon color="inherit" />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Dialog open={this.state.editModalOpen} onClose={this.handleModalClose}>
              <div>
                <UpdateCard closeModal={this.handleModalClose} fileInfo={this.state.selectedFile} />
              </div>
            </Dialog>
            <Dialog open={this.state.deleteModalOpen} onClose={this.handleModalClose}>
              <div>
                <DeleteFromCourseCard
                  closeModal={this.handleModalClose}
                  fileInfo={this.state.selectedFile}
                  courseInfo={course}
                />
              </div>
            </Dialog>
            <Dialog open={this.state.addToCourseModalOpen} onClose={this.handleModalClose}>
              <AddToCourseCard
                closeModal={this.handleModalClose}
                fileInfo={this.state.selectedFile}
                courseInfo={myCourses}
              />
            </Dialog>
          </TableContainer>
        </div>
      </Paper>
    );
  }
}

CoursePage.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(withRouter(CoursePage));
