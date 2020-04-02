import React, { Component } from "react";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import "./Styles/Card.css";
import { GlobalContext } from "./GlobalContext";

class DeleteCard extends Component {
  static contextType = GlobalContext;

  constructor(props) {
    super(props);

    this.cancelDelete = this.cancelDelete.bind(this);
    this.deleteFile = this.deleteFile.bind(this);
  }

  cancelDelete = () => {
    this.props.closeModal();
  };

  deleteFile = () => {
    const { fileInfo } = this.props;
    const { user, network } = this.context;
    network.deleteExistingFile(fileInfo.docId, user.uid);
    this.cancelDelete();
  };

  render() {
    const { fileInfo } = this.props;

    return (
      <Card className="card-body">
        <CardContent>
          <Typography variant="h5" color="textSecondary" gutterBottom>
            Delete File
          </Typography>
          <Typography variant="body2" className="mb-2" component="p" paragraph gutterBottom>
            Are you sure you want to delete {fileInfo.name}?
          </Typography>
          <Button className="mr-1" variant="contained" onClick={this.deleteFile}>
            Delete
          </Button>
          <Button variant="contained" onClick={this.cancelDelete}>
            Cancel
          </Button>
        </CardContent>
      </Card>
    );
  }
}

export default DeleteCard;
