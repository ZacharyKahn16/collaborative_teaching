import React, { Component } from "react";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";
import "./Styles/Card.css";
import { GlobalContext } from "./GlobalContext";

class DeleteCard extends Component {
  static contextType = GlobalContext;

  constructor(props) {
    super(props);

    this.state = {
      fileDisplayName: "",
    };

    this.cancelDelete = this.cancelDelete.bind(this);
    this.deleteFile = this.deleteFile.bind(this);
  }

  cancelDelete = () => {
    this.props.closeModal();

    this.setState(() => ({
      fileDisplayName: "",
    }));
  };

  deleteFile = () => {
    const { user, network } = this.context;
    network.updateExistingFile(this.state.uploadedFile, user.uid);
  };

  render() {
    return (
      <Card className="card-body">
        <CardContent>
          <Typography variant="h5" color="textSecondary" gutterBottom>
            Delete File
          </Typography>
          <Typography variant="body2" className="mb-2" component="p" paragraph gutterBottom>
            Are you sure you want to delete {this.props.fileInfo.name}?
          </Typography>
          <Button
            className="mr-1"
            variant="contained"
            color={""}
            onClick={this.deleteFile}
          >
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
