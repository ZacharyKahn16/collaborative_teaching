import React from 'react';
import PropTypes from 'prop-types';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
import { withStyles, makeStyles } from '@material-ui/core/styles';
import SearchIcon from '@material-ui/icons/Search';
import RefreshIcon from '@material-ui/icons/Refresh';
import Header from "./Header";
import CourseHeader from "./MyCoursesHeader";
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import SchoolIcon from "@material-ui/icons/School";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import AccountBalanceIcon from "@material-ui/icons/AccountBalance";
import ExitToAppIcon from "@material-ui/icons/ExitToApp";
import DeleteIcon from '@material-ui/icons/Delete';
import AddIcon from "@material-ui/icons/Add";
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';


const styles = theme => ({
    paper: {
        maxWidth: 936,
        margin: 'auto',
        overflow: 'hidden',
    },
    searchBar: {
        borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
    },
    searchInput: {
        fontSize: theme.typography.fontSize,
    },
    block: {
        display: 'block',
    },
    addUser: {
        marginRight: theme.spacing(1),
    },
    contentWrapper: {
        margin: '40px 16px',
    },
});

const useStyles = makeStyles({
    root: {
        width: 250,
        height: 250
    },
    media: {
        height: 140,
    },
});

let categories = [
    {
        id: 0,
        course: "CPSC 559",
        description: "Distributed systems.............."
    },
    {
        id: 1,
        course: "CPSC 471",
        description: "Database management systems.............."
    },
    {
        id: 2,
        course: "CPSC 565",
        description: "Emergent Computing.............."
    },
    {
        id: 3,
        course: "CPSC 413",
        description: "Algorithms.............."
    },
    {
        id: 4,
        course: "CPSC 405",
        description: "Entreupernship............."
    },
    {
        id: 5,
        course: "SENG 513",
        description: "Web based systems.............."
    }
];

function MyCourses(props) {
    const { classes } = props;
    const [mobileOpen, setMobileOpen] = React.useState(false);
    let [myClasses, setMyClasses] = React.useState(categories);
    const cardStyles = useStyles();
    let [courseName, setCourseName] = React.useState("");
    let [courseDescription, setCourseDescription] = React.useState("");

    const [open, setOpen] = React.useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleCloseCreation = (addedCourse) => {
        if (addedCourse) {
            addNewCourse(courseName, courseDescription)
        }
        setOpen(false);
    };

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    function deleteClass(index) {
        console.log(index)
        console.log(JSON.stringify(myClasses))
        // setMyClasses(myClasses.splice(index,1))
    }

    function addNewCourse(name, desc) {
        console.log('test add')
        setMyClasses([
            ...myClasses,
            {
                id: myClasses.length,
                course: name,
                description: desc
            }
        ]);
        console.log(myClasses)
    }

    function createCourseName(e) {
        console.log(e.target.value)
        setCourseName(e.target.value)
    }
    function createCourseDescription(e) {
        console.log(e.target.value)
        setCourseDescription(e.target.value)
    }

    return (
        <Paper id={"paperID"}>
            <CourseHeader onDrawerToggle={handleDrawerToggle} setTitle={"My Courses"} />
            {/*<h1>My Courses</h1>*/}
            <AppBar className={classes.searchBar} position="static" color="default" elevation={0}>
                <Toolbar>
                    <div className="flex-container">
                        {myClasses.map(({ id, course, description }, index) => (
                            <div key={id}>
                            <Card className={cardStyles.root} id={"courseCard"}>
                                <CardActionArea id={"cardInfo"}>
                                    <CardContent>
                                        <Typography gutterBottom variant="h5" component="h2">
                                            {course}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary" component="p">
                                            {description}
                                        </Typography>
                                    </CardContent>
                                </CardActionArea>
                                <CardActions className={"courseOptions"}>
                                    <IconButton aria-label="settings" onClick={deleteClass.bind(this, index)} >
                                        <DeleteIcon />
                                    </IconButton>
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
                                        <IconButton aria-label="settings">
                                            {/*<AddIcon onClick={() => addNewCourse()}/>*/}
                                            <AddIcon onClick={() => handleClickOpen()}/>
                                        </IconButton>
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        </div>
                    </div>
                </Toolbar>
            </AppBar>
            <Dialog open={open} onClose={() => handleCloseCreation(false)} aria-labelledby="form-dialog-title">
                <DialogTitle id="form-dialog-title">Create New Course</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        To create new course fill in these fields
                    </DialogContentText>
                    <TextField
                        margin="dense"
                        id="newCourseName"
                        label="Course Name"
                        type="text"
                        fullWidth
                        onChange = {createCourseName}
                    />
                    <TextField
                        margin="dense"
                        id="newCourseDescription"
                        label="Course Description"
                        type="text"
                        fullWidth
                        onChange = {createCourseDescription}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => handleCloseCreation(false)} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={() => handleCloseCreation(true)} color="primary">
                        Create Course
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
}

MyCourses.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(MyCourses);