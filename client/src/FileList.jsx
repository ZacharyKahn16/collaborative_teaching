import React, { Component } from "react";
import moment from "moment-timezone";
import PropTypes from "prop-types";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Link,
  Dialog,
  IconButton,
} from "@material-ui/core";
import "./Styles/FileList.css";
import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from "@material-ui/icons/Delete";
import UpdateCard from "./UpdateCard";
import { GlobalContext } from "./GlobalContext";

class FileList extends Component {
  static contextType = GlobalContext;

  constructor(props) {
    super(props);

    this.state = {
      editModalOpen: false,
      deleteModalOpen: false,
      selectedFile: null,
    };

    this.handleEditModalOpen = this.handleEditModalOpen.bind(this);
    this.handleDeleteModalOpen = this.handleDeleteModalOpen.bind(this);
    this.handleModalClose = this.handleModalClose.bind(this);
    this.updateSelectedFile = this.updateSelectedFile.bind(this);
  }

  handleEditModalOpen = (file) => {
    this.setState(() => ({
      selectedFile: file,
      editModalOpen: true,
    }));
  };

  handleDeleteModalOpen = () => {
    this.setState(() => ({
      deleteModalOpen: true,
    }));
  };

  handleModalClose = () => {
    this.setState(() => ({
      editModalOpen: false,
      deleteModalOpen: false,
    }));
  };

  updateSelectedFile = (fileId) => {
    const { setSelectedFileId } = this.context;

    setSelectedFileId(fileId);
  };

  render() {
    const { allFiles, user } = this.context;
    const { searchTerm } = this.props;

    const files = allFiles
      .filter((file) => {
        return user.uid === file.ownerId;
      })
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
          No files available
        </Typography>
      );
    }

    return (
      <TableContainer>
        <Table aria-label="simple table">
          <TableHead>
            <TableRow className="bold">
              <TableCell className="bold" align="left">
                File Name
              </TableCell>
              <TableCell className="bold" align="left">
                Course
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
                <TableCell align="left">{row.docId}</TableCell>
                <TableCell align="left">{row.name.split(".")[1].toUpperCase()}</TableCell>
                <TableCell align="left">{moment(row.lastUpdated).format("lll")}</TableCell>
                <TableCell align="center">
                  <IconButton
                    className="action-button"
                    onClick={() => this.handleEditModalOpen(row)}
                  >
                    <EditIcon color="inherit" />
                  </IconButton>
                  <IconButton className="action-button" onClick={this.handleDeleteModalOpen}>
                    <DeleteIcon color="inherit" />
                  </IconButton>
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
      </TableContainer>
    );
  }
}

FileList.propTypes = {
  searchTerm: PropTypes.string,
};

FileList.defaultProps = {
  searchTerm: "",
};

export default FileList;
