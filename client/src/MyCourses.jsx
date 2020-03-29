import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import {
  Grid,
  Divider,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Dialog,
  CardContent,
  Card,
  CardActionArea,
  CardActions,
  withStyles,
  Tooltip,
  IconButton,
  TextField,
  Button,
  Paper,
  Typography,
  AppBar,
} from "@material-ui/core";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import DeleteIcon from "@material-ui/icons/Delete";
import AddIcon from "@material-ui/icons/Add";
import { GlobalContext } from "./GlobalContext";
import Header from "./Header";

const styles = (theme) => ({
  container: {
    margin: "5px 12px 5px 0",
    width: "100%",
  },
  paper: {
    margin: "auto",
    maxHeight: "100vh",
    overflowX: "hidden",
    overflowY: "auto",
  },
  searchBar: {
    borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
  },
  searchInput: {
    fontSize: theme.typography.fontSize,
  },
  block: {
    display: "block",
  },
  addUser: {
    marginRight: theme.spacing(1),
  },
  contentWrapper: {
    margin: "40px 16px",
  },
  root: {
    maxHeight: 250,
    height: "100%",
  },
  cardActions: {
    justifyContent: "flex-end",
  },
});

class MyCourses extends React.Component {
  static contextType = GlobalContext;

  constructor(props) {
    super(props);

    this.state = {
      courseName: "",
      courseDescription: "",
      courseIndex: 0,
      openDialogueNewCourse: false,
      openEditCourse: false,
    };

    this.handleClickOpenEditCourse = this.handleClickOpenEditCourse.bind(this);
    this.handleCloseEditCourse = this.handleCloseEditCourse.bind(this);
    this.handleClickOpenDialogueNewCourse = this.handleClickOpenDialogueNewCourse.bind(this);
    this.handleCloseDialogueNewCourse = this.handleCloseDialogueNewCourse.bind(this);
    this.deleteClass = this.deleteClass.bind(this);
    this.createCourseName = this.createCourseName.bind(this);
    this.createCourseDescription = this.createCourseDescription.bind(this);
  }

  handleClickOpenEditCourse(index, courseName, courseDescription) {
    this.setState({
      courseName: courseName,
      courseDescription: courseDescription,
      courseIndex: index,
      openEditCourse: true,
      openDialogueNewCourse: false,
    });
  }

  handleClickOpenDialogueNewCourse() {
    this.setState({
      openDialogueNewCourse: true,
      openEditCourse: false,
    });
  }

  handleCloseEditCourse(editedCourse) {
    if (editedCourse) {
      console.log("somerthing");
      this.editCourse();
    }
    this.setState({
      openEditCourse: false,
    });
  }

  handleCloseDialogueNewCourse(addedCourse) {
    if (addedCourse) {
      this.addNewCourse(this.state.courseName, this.state.courseDescription);
    }
    this.setState({
      openDialogueNewCourse: false,
    });
  }

  deleteClass(index) {
    console.log(index);
    console.log(this.state.courseIndex);
  }

  createCourseName(e) {
    this.setState({
      courseName: e.target.value,
    });
  }

  createCourseDescription(e) {
    this.setState({
      courseDescription: e.target.value,
    });
  }

  editCourse() {
    console.log("test edit");
    const temp = this.state.myClasses;
    temp[this.state.courseIndex].course = this.state.courseName;
    temp[this.state.courseIndex].description = this.state.courseDescription;
    this.setState({
      myClasses: temp,
    });
  }

  addNewCourse(name, desc) {
    const { user, network } = this.context;
    network.addNewCourse(user.uid, name, desc);

    this.setState({
      openDialogueNewCourse: false,
      courseName: "",
      courseDescription: "",
    });
  }

  componentDidMount() {
    // console.log("mounted")
  }

  render() {
    const { classes } = this.props;
    const { user, allCourses } = this.context;

    const myCourses = allCourses
      .filter((course) => {
        return course.ownerId === user.uid;
      })
      .sort((a, b) => {
        return a.courseName.localeCompare(b.courseName);
      });

    const otherCourses = allCourses
      .filter((course) => {
        return course.ownerId !== user.uid;
      })
      .sort((a, b) => {
        return a.courseName.localeCompare(b.courseName);
      });

    return (
      <Paper className={classes.paper} square>
        <Header title={"Courses"} />
        <AppBar className={classes.searchBar} position="static" color="default" elevation={0}>
          <Grid container={true} spacing={3} className={classes.container}>
            <Grid item={true} xs={12}>
              <Typography variant="button">My Courses</Typography>
            </Grid>

            {myCourses.map((course, index) => (
              <Grid item={true} xs={12} sm={4} key={index}>
                <Card className={classes.root}>
                  <Link to={`/course-page/${course.docId}`} id={"courseLink"}>
                    <CardActionArea>
                      <CardContent>
                        <Typography gutterBottom variant="h5" component="h2">
                          {course.courseName}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" component="p">
                          {course.courseDesc}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Link>
                  <CardActions className={classes.cardActions}>
                    <Tooltip title={"Edit"}>
                      <IconButton
                        onClick={() =>
                          this.handleClickOpenEditCourse(
                            index,
                            course.courseName,
                            course.courseDesc,
                          )
                        }
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={"Remove"}>
                      <IconButton onClick={() => this.deleteClass(index)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Grid>
            ))}

            <Grid item={true} xs={12}>
              <Divider variant="middle" />
            </Grid>

            <Grid item={true} xs={12}>
              <Typography variant="button">Other Courses</Typography>
            </Grid>

            {otherCourses.map((course, index) => (
              <Grid item={true} xs={12} sm={4} key={index}>
                <Card className={classes.root}>
                  <Link to={`/course-page/${course.docId}`} id={"courseLink"}>
                    <CardActionArea>
                      <CardContent>
                        <Typography gutterBottom variant="h5" component="h2">
                          {course.courseName}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" component="p">
                          {course.courseDesc}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Link>
                  <CardActions className={classes.cardActions}>
                    <Tooltip title={"Edit"}>
                      <IconButton
                        onClick={() =>
                          this.handleClickOpenEditCourse(
                            index,
                            course.courseName,
                            course.courseDesc,
                          )
                        }
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={"Remove"}>
                      <IconButton onClick={() => this.deleteClass(index)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Grid>
            ))}
            <Grid item={true} xs={12}>
              <Divider variant="middle" />
            </Grid>

            <Grid item={true} xs={12} sm={4}>
              <Card className={classes.root}>
                <CardActionArea
                  id={"addNewCard"}
                  onClick={() => this.handleClickOpenDialogueNewCourse()}
                >
                  <CardContent>
                    <Tooltip title={"Click to add a new course"}>
                      <AddIcon />
                    </Tooltip>
                    <Typography gutterBottom variant="h5" component="h2">
                      Add New Course
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          </Grid>
        </AppBar>
        <Dialog
          open={this.state.openDialogueNewCourse}
          onClose={() => this.handleCloseDialogueNewCourse(false)}
        >
          <DialogTitle>Create New Course</DialogTitle>
          <DialogContent>
            <TextField
              margin="dense"
              label="Course Name"
              type="text"
              fullWidth
              onChange={this.createCourseName}
            />
            <TextField
              margin="dense"
              label="Course Description"
              type="text"
              fullWidth
              onChange={this.createCourseDescription}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => this.handleCloseDialogueNewCourse(false)} color="primary">
              Cancel
            </Button>
            <Button onClick={() => this.handleCloseDialogueNewCourse(true)} color="primary">
              Create Course
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={this.state.openEditCourse}
          onClose={() => this.handleCloseDialogueNewCourse(false)}
        >
          <DialogTitle>Edit Your Course</DialogTitle>
          <DialogContent>
            <DialogContentText>Make your changes and click save</DialogContentText>
            <TextField
              margin="dense"
              label="Course Name"
              type="text"
              fullWidth
              onChange={this.createCourseName}
              value={this.state.courseName}
            />
            <TextField
              margin="dense"
              label="Course Description"
              type="text"
              fullWidth
              onChange={this.createCourseDescription}
              value={this.state.courseDescription}
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
    );
  }
}

MyCourses.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(MyCourses);
