import React, { Component } from 'react';
import PropTypes from "prop-types";
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import Button from '@material-ui/core/Button';

import "./Styles/Card.css";

import {withStyles} from "@material-ui/core/styles";

class UploadCard extends Component {
    constructor(props) {
        super(props);

        this.state = {};
    }

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

                          </Typography>
                      </Grid>
                      <Grid className="upload-box-right" item xs={3}>
                          <Button className="browse-btn" component="label" variant="contained" color="primary">
                              <input className="display-none" type="file"/>
                              Browse
                          </Button>
                      </Grid>
                  </Grid>
                  <br/>
                  <br/>
                  <Button className="mr-1" variant="contained" color="primary">
                      Upload
                  </Button>
                  <Button variant="contained" onClick={this.props.closeModal}>
                      Cancel
                  </Button>
              </CardContent>
          </Card>
        );
    }
}

export default UploadCard;
