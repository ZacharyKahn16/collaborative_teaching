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

function MyCourses(props) {
  console.log(props)
  const workerInfo = props.workerInfo
  const { classes } = props;
  const cardStyles = useStyles();

  const [mobileOpen, setMobileOpen] = React.useState(false);
  let [myClasses, setMyClasses] = React.useState(categories);

  let [courseName, setCourseName] = React.useState("");
  let [courseDescription, setCourseDescription] = React.useState("");
  let [courseIndex, setCourseIndex] = React.useState(0);

  const [openDialogueNewCourse, setOpenDialogueNewCourse] = React.useState(false);
  const [openEditCourse, setOpenEditCourse] = React.useState(false);

  console.log(workerInfo)
  const socket = io("http://"+ workerInfo.publicIp +":4001");

  useEffect(() => {
    console.log("test")
    socket.on(
        "connect", () => {console.log("connected")}
    );
  }, []);

  const handleClickOpenDialogueNewCourse = () => {
    setOpenDialogueNewCourse(true);
  };

  const handleCloseDialogueNewCourse = (addedCourse) => {
    if (addedCourse) {
      addNewCourse(courseName, courseDescription);
    }
    setOpenDialogueNewCourse(false);
  };

  const handleClickOpenEditCourse = (index, courseName, courseDescription) => {
    setCourseName(courseName)
    setCourseDescription(courseDescription)
    setCourseIndex(index)
    setOpenEditCourse(true)
  };

  const handleCloseEditCourse = (editedCourse) => {
    if (editedCourse) {
      editCourse()
    }
    setOpenEditCourse(false)
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  function deleteClass(index) {
    console.log(index);
    console.log(JSON.stringify(myClasses));
    // setMyClasses(myClasses.splice(index,1))
  }

  function addNewCourse(name, desc) {
    console.log("test add");
    setMyClasses([
      ...myClasses,
      {
        id: myClasses.length,
        course: name,
        description: desc,
        path: "/course-page/"+name.replace(/ /g,'')
      }
    ]);
  }

  function createCourseName(e) {
    setCourseName(e.target.value);
  }
  function createCourseDescription(e) {
    setCourseDescription(e.target.value);
  }

  function editCourse() {
    console.log("test edit");
    console.log(courseIndex);
    myClasses[courseIndex].course = courseName
    myClasses[courseIndex].description = courseDescription
    setMyClasses(myClasses)
  }

  return (
    <Paper className={classes.paper}>
      <Header
        onDrawerToggle={handleDrawerToggle}
        setTitle={{name:"My Courses"}}
        setWorkerDis={{name: workerInfo.id}}
      />
      {/*<h1>My Courses</h1>*/}
      <AppBar
        className={classes.searchBar}
        position="static"
        color="default"
        elevation={0}
      >
        <Toolbar>
          <div className="flex-container">
            {myClasses.map(({ id, course, description, path }, index) => (
              <div key={id}>
                <Card className={cardStyles.root} id={"courseCard"}>
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
                        aria-label="settings"
                        onClick={() => handleClickOpenEditCourse(index, course, description)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={"Remove"}>
                      <IconButton
                        aria-label="settings"
                        onClick={deleteClass.bind(this, index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              </div>
            ))}
            <div>
              <Card className={cardStyles.root} id={"courseCard"}>
                <CardActionArea id={"addNewCard"}>
                  <CardContent>
                    <Typography gutterBottom variant="h5" component="h2">
                      Add New Course
                    </Typography>
                    <Tooltip title={"Click to add course"}>
                      {/*<IconButton aria-label="settings">*/}
                        <AddIcon
                          onClick={() => handleClickOpenDialogueNewCourse()}
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
      <Dialog open={openDialogueNewCourse} onClose={() => handleCloseDialogueNewCourse(false)} aria-labelledby="form-dialog-title">
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
            onChange={createCourseName}
          />
          <TextField
            margin="dense"
            id="newCourseDescription"
            label="Course Description"
            type="text"
            fullWidth
            onChange={createCourseDescription}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => handleCloseDialogueNewCourse(false)}
            color="primary"
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleCloseDialogueNewCourse(true)}
            color="primary"
          >
            Create Course
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={openEditCourse} onClose={() => handleCloseDialogueNewCourse(false)} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">Edit Your Course</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Make your changes and click save
          </DialogContentText>
          <TextField margin="dense" id="newCourseName" label="Course Name" type="text" fullWidth onChange={createCourseName} value={courseName} />
          <TextField margin="dense" id="newCourseDescription" label="Course Description" type="text" fullWidth onChange={createCourseDescription} value={courseDescription}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleCloseEditCourse(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={() => handleCloseEditCourse(true)} color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

MyCourses.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(MyCourses);
