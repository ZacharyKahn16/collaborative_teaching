import React, { Component } from "react";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";
import "./Styles/Card.css";
import { GlobalContext } from "./GlobalContext";

const MAX_SIZE = 10485760; // 10 MB

class UpdateCard extends Component {
  static contextType = GlobalContext;

  constructor(props) {
    super(props);

    this.state = {
      fileDisplayName: "",
      uploadedFile: null,
    };

    this.onBrowseChange = this.onBrowseChange.bind(this);
    this.cancelUpload = this.cancelUpload.bind(this);
    this.updateFileBtn = this.updateFileBtn.bind(this);
  }

  onBrowseChange = (e) => {
    const { fileInfo } = this.props;
    const files = e.target.files;
    const uploadedFile = files[0];
    uploadedFile.docId = fileInfo.docId;

    this.setState(() => ({
      fileDisplayName: files[0].name,
      uploadedFile: files[0],
    }));
  };

  cancelUpload = () => {
    this.props.closeModal();

    this.setState(() => ({
      fileDisplayName: "",
      uploadedFile: null,
    }));
  };

  updateFileBtn = () => {
    if (this.state.uploadedFile && this.state.uploadedFile.size < MAX_SIZE) {
      const { user, network } = this.context;
      network.updateExistingFile(this.state.uploadedFile, user.uid);
      this.props.closeModal();
    }
  };

  render() {
    return (
      <Card className="card-body">
        <CardContent>
          <Typography variant="h5" color="textSecondary" gutterBottom>
            Update File
          </Typography>
          <Typography variant="body2" component="p" paragraph gutterBottom>
            Browse for a file on your computer to update this file.
            <br />
            <br />
            File to Update: {this.props.fileInfo.name}
          </Typography>
          <Grid className="upload-box-container" container spacing={0}>
            <Grid className="upload-box-left" item xs={9}>
              <Typography className="file-name-p" variant="body2" component="p" noWrap>
                {this.state.fileDisplayName}
              </Typography>
            </Grid>
            <Grid className="upload-box-right" item xs={3}>
              <Button className="browse-btn" component="label" variant="contained" color="primary">
                <input className="display-none" type="file" onChange={this.onBrowseChange} />
                Browse
              </Button>
            </Grid>
          </Grid>
          <br />
          {this.state.uploadedFile && this.state.uploadedFile.size >= MAX_SIZE ? (
            <Typography variant="subtitle2" color="error">
              Max file size is 10MB
            </Typography>
          ) : null}
          <br />
          <Button
            className="mr-1"
            variant="contained"
            color={this.state.uploadedFile ? "primary" : undefined}
            disabled={!this.state.uploadedFile || this.state.uploadedFile.size >= MAX_SIZE}
            onClick={this.updateFileBtn}
          >
            Upload
          </Button>
          <Button variant="contained" onClick={this.cancelUpload}>
            Cancel
          </Button>
        </CardContent>
      </Card>
    );
  }
}

export default UpdateCard;
