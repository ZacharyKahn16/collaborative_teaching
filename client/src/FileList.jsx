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
import { listen, retrieveAllFiles, retrieveFile } from "./service";
import { UserContext } from "./UserContext";
import FileViewModal from "./FileViewModal";
import { v4 as uuidv4 } from "uuid";

class FileList extends Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);

    this.state = {
      editModalOpen: false,
      deleteModalOpen: false,
      selectedFile: {},
      allDocsReady: false,
      allDocs: [],
      viewFile: null,
    };

    this.handleEditModalOpen = this.handleEditModalOpen.bind(this);
    this.handleDeleteModalOpen = this.handleDeleteModalOpen.bind(this);
    this.handleViewModalOpen = this.handleViewModalOpen.bind(this);
    this.handleModalClose = this.handleModalClose.bind(this);
    this.createData = this.createData.bind(this);
  }

  componentDidMount() {
    const { socket } = this.props;
    listen(socket, (msg) => {
      console.log("callback");
      console.log(msg);
      this.setState(() => ({
        viewFile: msg.message[0],
      }));
    });
  }

  populateFileTable = (msg) => {
    let temp = [];
    const { user } = this.context;
    msg.forEach(function(doc) {
      if (user.name === doc.ownerId) {
        temp.push({
          fileName: doc.name,
          fileType: doc.name.split(".")[1],
          fileId: doc.docId,
          owner: doc.ownerId,
          dateUploaded: doc.lastUpdated,
        });
      }
    });
    this.setState({
      allDocs: temp,
      allDocsReady: true,
    });
  };

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

  handleViewModalOpen = (fileId) => {
    const { socket } = this.props;
    retrieveFile(socket, fileId, uuidv4());
  };

  handleModalClose = () => {
    this.setState(() => ({
      editModalOpen: false,
      deleteModalOpen: false,
      viewFile: null,
    }));
  };

  render() {
    const { socket } = this.props;

    retrieveAllFiles(socket, (msg) => {
      console.log(msg);
      if (msg.length !== 0) {
        this.populateFileTable(msg);
      }
    });
    if (this.state.allDocsReady === false || this.state.allDocs.length === 0) {
      return (
        <Typography color="textSecondary" align="center">
          No docs loaded yet
        </Typography>
      );
    }
    return (
      <TableContainer>
        {this.state.viewFile !== null ? (
          <FileViewModal
            open={true}
            fileName={this.state.viewFile.fileName}
            fileContent={this.state.viewFile.fileContents}
            onClose={this.handleModalClose}
          />
        ) : null}
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
            {this.state.allDocs.map((row) => (
              <TableRow key={row.fileId}>
                <TableCell align="left">
                  <Typography variant="body2">
                    <Link
                      color="primary"
                      href="#"
                      onClick={() => {
                        //TODO: View file
                        this.handleViewModalOpen(row.fileId);
                      }}
                    >
                      {row.fileName}
                    </Link>
                  </Typography>
                </TableCell>
                <TableCell align="left">{row.fileId ? row.fileId : "None"}</TableCell>
                <TableCell align="left">{row.fileType}</TableCell>
                <TableCell align="left">{row.owner}</TableCell>
                <TableCell align="left">{row.dateUploaded}</TableCell>
                <TableCell align="center">
                  <IconButton
                    className="action-button"
                    key={row.fileName}
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
            style: { backgroundColor: "rgba(0,0,0,0.7)" },
          }}
        >
          <Fade in={this.state.editModalOpen}>
            <div>
              {/*TODO: Conditional card for either editing or deleting*/}
              <UpdateCard
                closeModal={this.handleModalClose}
                socket={this.props.socket}
                fileInfo={this.state.selectedFile}
              />
            </div>
          </Fade>
        </Modal>
      </TableContainer>
    );
  }
}

FileList.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default FileList;
