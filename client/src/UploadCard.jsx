import React, { Component } from "react";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";
import "./Styles/Card.css";
import { writeNewFile, listen, retrieveFile } from "./service";

class UploadCard extends Component {
  constructor(props) {
    super(props);

    this.state = {
      fileDisplayName: "",
      uploadedFile: null
    };

    this.onBrowseChange = this.onBrowseChange.bind(this);
    this.cancelUpload = this.cancelUpload.bind(this);
    this.uploadFile = this.uploadFile.bind(this);
  }

  componentDidMount() {
    const { socket } = this.props;
    console.log(socket);

    listen(socket, msg => {
      console.log("callback");
      console.log(msg);
    });
  }

  onBrowseChange = e => {
    let files = e.target.files;

    this.setState(() => ({
      fileDisplayName: files[0].name,
      uploadedFile: files[0]
    }));
  };

  cancelUpload = () => {
    this.props.closeModal();
    this.setState(() => ({
      fileDisplayName: "",
      uploadedFile: null
    }));
  };

  uploadFile = () => {
    const { socket } = this.props;
    // retrieveFile(socket, 'x0RCUvWjlIZifyb3MQen', 'Daniel')
    writeNewFile(socket, this.state.uploadedFile, "Test Owner");
    console.log("uploading");
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
              <Typography
                className="file-name-p"
                variant="body2"
                component="p"
                noWrap
              >
                {this.state.fileDisplayName}
              </Typography>
            </Grid>
            <Grid className="upload-box-right" item xs={3}>
              <Button
                className="browse-btn"
                component="label"
                variant="contained"
                color="primary"
              >
                <input
                  className="display-none"
                  type="file"
                  onChange={this.onBrowseChange}
                />
                Browse
              </Button>
            </Grid>
          </Grid>
          <br />
          <br />
          <Button
            className="mr-1"
            variant="contained"
            color={this.state.uploadedFile ? "primary" : ""}
            disabled={!this.state.uploadedFile}
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

export default UploadCard;
