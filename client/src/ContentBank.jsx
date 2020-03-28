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
  Link,
  IconButton,
  Dialog,
} from "@material-ui/core";
import DeleteIcon from "@material-ui/icons/Delete";
import AddIcon from "@material-ui/icons/Add";
import moment from "moment-timezone";
import UpdateCard from "./UpdateCard";
import "./Styles/FileList.css";
import { GlobalContext } from "./GlobalContext";

class ContentBank extends Component {
  static contextType = GlobalContext;

  constructor(props) {
    super(props);

    this.state = {
      editModalOpen: false,
      deleteModalOpen: false,
      selectedFile: {},
    };

    this.handleEditModalOpen = this.handleEditModalOpen.bind(this);
    this.handleDeleteModalOpen = this.handleDeleteModalOpen.bind(this);
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
    const { allFiles } = this.context;
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
          No documents in the content bank
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
                <TableCell align="left">{row.ownerName}</TableCell>
                <TableCell align="left">{moment(row.lastUpdated).format("lll")}</TableCell>
                <TableCell align="center">
                  <IconButton
                    className="action-button"
                    key={row.fileName}
                    onClick={() => this.handleEditModalOpen(row)}
                  >
                    <AddIcon color="inherit" />
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
          <div>
            {/*TODO: Conditional card for either editing or deleting*/}
            <UpdateCard
              closeModal={this.handleModalClose}
              socket={this.props.socket}
              fileInfo={this.state.selectedFile}
            />
          </div>
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
