import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Typography from "@material-ui/core/Typography";
import Link from "@material-ui/core/Link";
import React, { Component } from "react";
import PropTypes from "prop-types";
import "./Styles/FileList.css";
import IconButton from "@material-ui/core/IconButton";
import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from "@material-ui/icons/Delete";
import Modal from "@material-ui/core/Modal";
import Backdrop from "@material-ui/core/Backdrop";
import Fade from "@material-ui/core/Fade";
import UpdateCard from "./UpdateCard";
import { listen, retrieveFile, getAllFiles } from "./service";

class FileList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      editModalOpen: false,
      deleteModalOpen: false,
      selectedFileName: ""
    };

    this.handleEditModalOpen = this.handleEditModalOpen.bind(this);
    this.handleDeleteModalOpen = this.handleDeleteModalOpen.bind(this);
    this.handleModalClose = this.handleModalClose.bind(this);
  }

  componentDidMount() {
    const { socket } = this.props;
  }

  createData = (fileName, fileType, courseName, owner, dateUploaded) => {
    return { fileName, fileType, courseName, owner, dateUploaded };
  };

  rows = [
    this.createData(
      "Replication & Fault Tolerance.ppt",
      "PPT",
      "CPSC 559",
      "Garland Khuu",
      "02-21-2020"
    ),
    this.createData(
      "Dynamic Programming.pdf",
      "PDF",
      "CPSC 413",
      "Garland Khuu",
      "11-16-2019"
    ),
    this.createData(
      "Utilitarianism.pdf",
      "PDF",
      "PHIL 249",
      "Garland Khuu",
      "09-20-2016"
    ),
    this.createData(
      "10 Tips for Success in Computer Science.ppt",
      "PPT",
      "",
      "Garland Khuu",
      "03-05-2020"
    ),
    this.createData(
      "Password Hashing.pdf",
      "PDF",
      "CPSC 329",
      "Garland Khuu",
      "01-28-2019"
    )
  ];

  handleEditModalOpen = fileName => {
    console.log(fileName);
    this.setState(() => ({
      editModalOpen: true,
      selectedFileName: fileName
    }));
  };

  handleDeleteModalOpen = () => {
    this.setState(() => ({
      deleteModalOpen: true
    }));
  };

  handleModalClose = () => {
    this.setState(() => ({
      editModalOpen: false,
      deleteModalOpen: false
    }));
  };

  render() {
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
                Date Uploaded
              </TableCell>
              <TableCell className="bold" align="center">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {this.rows.map(row => (
              <TableRow key={row.fileName}>
                <TableCell align="left">
                  <Typography variant="body2">
                    <Link
                      color="primary"
                      href="#"
                      onClick={() => {
                        //TODO: View file
                      }}
                    >
                      {row.fileName}
                    </Link>
                  </Typography>
                </TableCell>
                <TableCell align="left">
                  {row.courseName ? row.courseName : "None"}
                </TableCell>
                <TableCell align="left">{row.fileType}</TableCell>
                <TableCell align="left">{row.owner}</TableCell>
                <TableCell align="left">{row.dateUploaded}</TableCell>
                <TableCell align="center">
                  <IconButton
                    className="action-button"
                    key={row.fileName}
                    onClick={() => this.handleEditModalOpen(row.fileName)}
                  >
                    <EditIcon color="inherit" />
                  </IconButton>
                  <IconButton
                    className="action-button"
                    onClick={this.handleDeleteModalOpen}
                  >
                    <DeleteIcon color="inherit" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Modal
          aria-labelledby="transition-modal-title"
          aria-describedby="transition-modal-description"
          className="modal"
          open={this.state.editModalOpen}
          onClose={this.handleModalClose}
          closeAfterTransition
          BackdropComponent={Backdrop}
          BackdropProps={{
            timeout: 500,
            style: { backgroundColor: "rgba(0,0,0,0.7)" }
          }}
        >
          <Fade in={this.state.editModalOpen}>
            <div>
              {/*TODO: Conditional card for either editing or deleting*/}
              <UpdateCard
                closeModal={this.handleModalClose}
                socket={this.props.socket}
                fileName={this.state.selectedFileName}
              />
            </div>
          </Fade>
        </Modal>
      </TableContainer>
    );
  }
}

FileList.propTypes = {
  classes: PropTypes.object.isRequired
};

export default FileList;
