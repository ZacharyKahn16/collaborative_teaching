import React, {useEffect} from "react";
import PropTypes from "prop-types";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from "@material-ui/core/IconButton";
import { withStyles, makeStyles } from "@material-ui/core/styles";
import Header from "./Header";
import Card from "@material-ui/core/Card";
import CardActionArea from "@material-ui/core/CardActionArea";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import DeleteIcon from "@material-ui/icons/Delete";
import AddIcon from "@material-ui/icons/Add";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import {Link} from "react-router-dom";
import io from "socket.io-client";
import axios from "axios";


const styles = theme => ({
  paper: {
    // maxWidth: 936,
    margin: "auto",
    overflow: "hidden"
  },
  searchBar: {
    borderBottom: "1px solid rgba(0, 0, 0, 0.12)"
  },
  searchInput: {
    fontSize: theme.typography.fontSize
  },
  block: {
    display: "block"
  },
  addUser: {
    marginRight: theme.spacing(1)
  },
  contentWrapper: {
    margin: "40px 16px"
  },
  root: {
    width: 250,
    height: 250
  }
});

const useStyles = makeStyles({
  root: {
    width: 250,
    height: 250
  },
  media: {
    height: 140
  }
});

let categories = [
  {
    id: 0,
    course: "CPSC 559",
    description: "Distributed systems..............",
    path: "/course-page/CPSC559"
  },
  {
    id: 1,
    course: "CPSC 471",
    description: "Database management systems..............",
    path: "/course-page/CPSC471"
  },
  {
    id: 2,
    course: "CPSC 565",
    description: "Emergent Computing..............",
    path: "/course-page/CPSC565"
  },
  {
    id: 3,
    course: "CPSC 413",
    description: "Algorithms..............",
    path: "/course-page/CPSC413"
  },
  {
    id: 4,
    course: "CPSC 405",
    description: "Entreupernship.............",
    path: "/course-page/CPSC405"
  },
  {
    id: 5,
    course: "SENG 513",
    description: "Web based systems..............",
    path: "/course-page/SENG513"
  }
];

class MyCourses extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      mobileOpen: false,
      myClasses: categories,
      courseName: "",
      courseDescription: "",
      courseIndex: 0,
      openDialogueNewCourse: false,
      openEditCourse: false
    };
    this.handleClickOpenEditCourse = this.handleClickOpenEditCourse.bind(this);
    this.handleCloseEditCourse = this.handleCloseEditCourse.bind(this);
    this.handleClickOpenDialogueNewCourse = this.handleClickOpenDialogueNewCourse.bind(this);
    this.handleCloseDialogueNewCourse = this.handleCloseDialogueNewCourse.bind(this);
    this.deleteClass = this.deleteClass.bind(this);
    this.createCourseName = this.createCourseName.bind(this);
    this.createCourseDescription = this.createCourseDescription.bind(this);
    // this.handleChange = this.handleChange.bind(this);
    // this.handleSubmit = this.handleSubmit.bind(this);

  }

  handleDrawerToggle = () => {
    // this.state.mobileOpen = !this.state.mobileOpen;
    this.setState({
      mobileOpen: !this.state.mobileOpen
    })
  };

  handleClickOpenEditCourse(index, courseName, courseDescription) {
    this.setState({
      courseName: courseName,
      courseDescription: courseDescription,
      courseIndex: index,
      openEditCourse: true
    })

  };

  handleClickOpenDialogueNewCourse() {
    this.setState({
      openDialogueNewCourse: true
    })
  }

  handleCloseEditCourse(editedCourse) {
    if (editedCourse) {
      console.log("somerthing")
      this.editCourse()
    }
    this.setState({
      openEditCourse: false
    })
  }

  handleCloseDialogueNewCourse(addedCourse) {
    if (addedCourse) {
      this.addNewCourse(this.state.courseName, this.state.courseDescription)
    }
    this.setState({
      openDialogueNewCourse: false
    })
  };


  deleteClass(index) {
    console.log(index);
    console.log(this.state.courseIndex)
  };

  createCourseName(e) {
    console.log(e)
    console.log(e.target.value)
    this.setState({
      courseName: e.target.value
    })
  }

  createCourseDescription(e) {
    this.setState({
      courseDescription: e.target.value
    })
  }

  editCourse() {
    console.log("test edit");
    let temp = this.state.myClasses
    temp[this.state.courseIndex].course = this.state.courseName
    temp[this.state.courseIndex].description = this.state.courseDescription
    this.setState({
      myClasses: temp
    })
  }

  addNewCourse(name, desc) {
    console.log("test add");
    console.log(name)
    let temp = this.state.myClasses
    temp.push({
      id: this.state.myClasses.length,
      course: name,
      description: desc,
      path: "/course-page/"+name.replace(/ /g,'')
    })
    this.setState({
      myClasses: temp
    })
    console.log(this.state.myClasses)
  }


  componentDidMount() {
    // console.log("mounted")
  }



  render() {
    const { classes, workerInfo } = this.props;
    console.log(workerInfo)
    return (
        <Paper className={classes.paper}>
          {/*hello*/}

          <Header
              onDrawerToggle={this.handleDrawerToggle}
              setTitle={{name: "My Courses"}}
              setWorkerDis={{name: workerInfo}}
          />
          <AppBar
              className={this.props.classes.searchBar}
              position="static"
              color="default"
              elevation={0}
          >
            <Toolbar>
              <div className={"flex-container"}>
                {this.state.myClasses.map(({id, course, description, path}, index) => (
                    <div key={id}>
                      <Card className={classes.root} id={"courseCard"}>
                        <Link to={path} id={"courseLink"}>
                          <CardActionArea id={"cardInfo"}>
                            <CardContent>
                              <Typography gutterBottom variant="h5" component="h2">
                                {course}
                              </Typography>
                              <Typography
                                  variant="body2"
                                  color="textSecondary"
                                  component="p"
                              >
                                {description}
                              </Typography>
                            </CardContent>
                          </CardActionArea>
                        </Link>
                        <CardActions className={"courseOptions"}>
                          <Tooltip title={"Edit"}>
                            <IconButton
                                aria-label={"settings"}
                                onClick={() => this.handleClickOpenEditCourse(index, course, description)}
                            >
                              <MoreVertIcon/>
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={"Remove"}>
                            <IconButton
                                aria-label="settings"
                                onClick={() => this.deleteClass(index)}
                            >
                              <DeleteIcon/>
                            </IconButton>
                          </Tooltip>
                        </CardActions>
                      </Card>
                    </div>
                ))}
                <div>
                  <Card className={classes.root} id={"courseCard"}>
                    <CardActionArea id={"addNewCard"}>
                      <CardContent>
                        <Typography gutterBottom variant="h5" component="h2">
                          Add New Course
                        </Typography>
                        <Tooltip title={"Click to add course"}>
                          {/*<IconButton aria-label="settings">*/}
                          <AddIcon
                              onClick={() => this.handleClickOpenDialogueNewCourse()}
                          />
                          {/*</IconButton>*/}
                        </Tooltip>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </div>
              </div>
            </Toolbar>
          </AppBar>
          <Dialog open={this.state.openDialogueNewCourse} onClose={() => this.handleCloseDialogueNewCourse(false)} aria-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">Create New Course</DialogTitle>
            <DialogContent>
              <DialogContentText>
                To create new course fill in these fieldss
              </DialogContentText>
              <TextField
                  margin="dense"
                  id="newCourseName"
                  label="Course Name"
                  type="text"
                  fullWidth
                  onChange={this.createCourseName}
              />
              <TextField
                  margin="dense"
                  id="newCourseDescription"
                  label="Course Description"
                  type="text"
                  fullWidth
                  onChange={this.createCourseDescription}
              />
            </DialogContent>
            <DialogActions>
              <Button
                  onClick={() => this.handleCloseDialogueNewCourse(false)}
                  color="primary"
              >
                Cancel
              </Button>
              <Button
                  onClick={() => this.handleCloseDialogueNewCourse(true)}
                  color="primary"
              >
                Create Course
              </Button>
            </DialogActions>
          </Dialog>
          <Dialog open={this.state.openEditCourse} onClose={() => this.handleCloseDialogueNewCourse(false)} aria-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">Edit Your Course</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Make your changes and click save
              </DialogContentText>
              <TextField margin="dense" id="newCourseName" label="Course Name" type="text" fullWidth onChange={this.createCourseName} value={this.state.courseName} />
              <TextField margin="dense" id="newCourseDescription" label="Course Description" type="text" fullWidth onChange={this.createCourseDescription} value={this.state.courseDescription}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => this.handleCloseEditCourse(false)} color="primary">
                Cancel
              </Button>
              <Button onClick={() => this.handleCloseEditCourse(true)} color="primary">
                Save Changes
              </Button>
            </DialogActions>
          </Dialog>
        </Paper>
    )
  }
}


MyCourses.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(MyCourses);
