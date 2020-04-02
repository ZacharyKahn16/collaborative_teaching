import React from "react";
import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";
import {
  AppBar,
  Dialog,
  IconButton,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Toolbar,
  Typography,
  withStyles,
} from "@material-ui/core";
import Header from "./Header";
import { GlobalContext } from "./GlobalContext";
import moment from "moment-timezone";
import DeleteIcon from "@material-ui/icons/Delete";
import AddIcon from "@material-ui/icons/Add";
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
      deleteModalOpen: false,
      addToCourseModalOpen: false,
    };

    this.updateSelectedFile = this.updateSelectedFile.bind(this);
  }

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
          <Toolbar />
        </AppBar>

        <div className={classes.contentWrapper}>
          {files.length === 0 ? (
            <Typography color="textSecondary" align="center">
              No files in this course
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
                      {course.ownerId === user.uid ? (
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
          )}
        </div>
      </Paper>
    );
  }
}

CoursePage.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(withRouter(CoursePage));
