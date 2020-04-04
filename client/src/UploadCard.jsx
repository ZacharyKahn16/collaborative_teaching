import React, { Component } from "react";
import PropTypes from "prop-types";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";
import "./Styles/Card.css";
import { GlobalContext } from "./GlobalContext";

const MAX_SIZE = 10485760; // 10 MB

class UploadCard extends Component {
  static contextType = GlobalContext;

  constructor(props) {
    super(props);

    this.state = {
      fileDisplayName: "",
      uploadedFile: null,
    };

    this.onBrowseChange = this.onBrowseChange.bind(this);
    this.cancelUpload = this.cancelUpload.bind(this);
    this.uploadFile = this.uploadFile.bind(this);
  }

  onBrowseChange = (e) => {
    const files = e.target.files;

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

  uploadFile = () => {
    if (this.state.uploadedFile && this.state.uploadedFile.size < MAX_SIZE) {
      const { user, network } = this.context;
      network.writeNewFile(this.state.uploadedFile, user.uid);
      this.props.closeModal();
    }
  };

  render() {
    return (
      <Card className="card-body">
        <CardContent>
          <Typography variant="h5" color="textSecondary" gutterBottom>
            Upload File
          </Typography>
          <Typography variant="body2" component="p" paragraph gutterBottom>
            Browse for a file on your computer to upload.
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
            onClick={this.uploadFile}
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

UploadCard.propTypes = {
  closeModal: PropTypes.func.isRequired,
};

export default UploadCard;
