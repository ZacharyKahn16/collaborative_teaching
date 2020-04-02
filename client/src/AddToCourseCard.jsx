import React, { Component } from "react";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import "./Styles/Card.css";
import { GlobalContext } from "./GlobalContext";

class AddToCourseCard extends Component {
  static contextType = GlobalContext;

  constructor(props) {
    super(props);

    this.state = {
      selectedFile: null,
    };

    this.addToCourse = this.addToCourse.bind(this);
  }

  addToCourse = (course) => {
    const { user, network } = this.context;
    const { fileInfo } = this.props;
    network.addFileToCourse(user.uid, course.docId, fileInfo.docId);
    this.props.closeModal();
  };

  render() {
    const { fileInfo, courseInfo } = this.props;

    if (courseInfo.length === 0) {
      return (
        <Typography color="textSecondary" align="center">
          You have no courses that you can add this file to. Please create a course then try again
        </Typography>
      );
    }

    return (
      <Card className="card-body">
        <CardContent>
          <Typography variant="h5" color="textSecondary" gutterBottom>
            Add file to a course
          </Typography>
          <Typography variant="body2" className="mb-2" component="p" paragraph gutterBottom>
            Which course would you like to add {fileInfo.name} to?
          </Typography>
          <div className="root">
            <List component="nav" aria-label="secondary mailbox folders">
              {courseInfo.map((course) => (
                <ListItem button key={course.docId} onClick={() => this.addToCourse(course)}>
                  <ListItemText primary={course.courseName} secondary={course.courseDesc} />
                </ListItem>
              ))}
            </List>
          </div>
          {/*<Button variant="contained" onClick={this.cancelDelete}>*/}
          {/*  Cancel*/}
          {/*</Button>*/}
        </CardContent>
      </Card>
    );
  }
}

export default AddToCourseCard;
