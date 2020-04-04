import React, { Component } from "react";
import PropTypes from "prop-types";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Dialog,
  Button,
  Tooltip,
} from "@material-ui/core";
import DeleteIcon from "@material-ui/icons/Delete";
import EditIcon from "@material-ui/icons/Edit";
import moment from "moment-timezone";
import UpdateCard from "./UpdateCard";
import DeleteCard from "./DeleteCard";
import "./Styles/FileList.css";
import { GlobalContext } from "./GlobalContext";
import AddIcon from "@material-ui/icons/Add";
import AddToCourseCard from "./AddToCourseCard";
import Avatar from "@material-ui/core/Avatar";

class ContentBank extends Component {
  static contextType = GlobalContext;

  constructor(props) {
    super(props);

    this.state = {
      editModalOpen: false,
      deleteModalOpen: false,
      addToCourseModalOpen: false,
      selectedFile: {},
    };

    this.handleEditModalOpen = this.handleEditModalOpen.bind(this);
    this.handleDeleteModalOpen = this.handleDeleteModalOpen.bind(this);
    this.handleAddToCourseModalOpen = this.handleAddToCourseModalOpen.bind(this);
    this.handleModalClose = this.handleModalClose.bind(this);
    this.updateSelectedFile = this.updateSelectedFile.bind(this);
  }

  createData = (fileName, fileType, courseName, owner, dateUploaded) => {
    return { fileName, fileType, courseName, owner, dateUploaded };
  };

  handleEditModalOpen = (file) => {
    console.log(file);
    this.setState(() => ({
      editModalOpen: true,
      selectedFile: file,
    }));
  };

  handleDeleteModalOpen = (file) => {
    this.setState(() => ({
      deleteModalOpen: true,
      selectedFile: file,
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
    const { searchTerm } = this.props;

    const files = allFiles
      .filter((file) => {
        return (
          file.name.includes(searchTerm) ||
          file.ownerName.includes(searchTerm) ||
          file.courseIds.includes(searchTerm)
        );
      })
      .sort((a, b) => {
        return b.lastUpdated - a.lastUpdated;
      });

    if (files.length === 0) {
      return (
        <Typography color="textSecondary" align="center">
          No files in the content bank
        </Typography>
      );
    }

    const myCourses = allCourses
      .filter((course) => {
        return course.ownerId === user.uid;
      })
      .sort((a, b) => {
        return a.courseName.localeCompare(b.courseName);
      });

    return (
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
                    <Button
                      color="primary"
                      onClick={() => {
                        this.updateSelectedFile(row.docId);
                      }}
                    >
                      {row.name}
                    </Button>
                  </Typography>
                </TableCell>
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
                <TableCell align="left">{row.ownerName}</TableCell>
                <TableCell align="left">{moment(row.lastUpdated).format("lll")}</TableCell>
                {row.ownerId === user.uid ? (
                  <TableCell align="center">
                    <IconButton
                      className="action-button"
                      key={row.fileName}
                      onClick={() => this.handleEditModalOpen(row)}
                    >
                      <EditIcon color="inherit" />
                    </IconButton>
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
            <DeleteCard closeModal={this.handleModalClose} fileInfo={this.state.selectedFile} />
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
    );
  }
}

ContentBank.propTypes = {
  searchTerm: PropTypes.string,
};

ContentBank.defaultProps = {
  searchTerm: "",
};

export default ContentBank;
