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

const categories = [
    {
        course: "CPSC 559",
        description: "Distributed systems.............."
    },
    {
        course: "CPSC 471",
        description: "Database management systems.............."
    },
    {
        course: "CPSC 565",
        description: "Emergent Computing.............."
    },
    {
        course: "CPSC 413",
        description: "Algorithms.............."
    },
    {
        course: "CPSC 405",
        description: "Entreupernship............."
    },
    {
        course: "SENG 513",
        description: "Web based systems.............."
    }
];

function MyCourses(props) {
    const { classes } = props;
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const cardStyles = useStyles();

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    return (
        <Paper id={"paperID"}>
            {/*<Header onDrawerToggle={handleDrawerToggle} />*/}
            <h1>My Courses</h1>
            <AppBar className={classes.searchBar} position="static" color="default" elevation={0}>
                <Toolbar>
                    <div className="flex-container">
                        {/*<div>1</div>*/}
                        {/*<div>2</div>*/}
                        {/*<div>3</div>*/}
                        {/*<div>4</div>*/}
                        {/*<div>5</div>*/}
                        {/*<div>6</div>*/}
                        {/*<div>7</div>*/}
                        {/*<div>8</div>*/}
                        {/*<div>9</div>*/}
                        {/*<div>10</div>*/}
                        {categories.map(({ id, course, description }) => (
                            <div>
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
                                        <Button size="small" color="primary">
                                            View
                                        </Button>
                                        <IconButton aria-label="settings">
                                            <MoreVertIcon />
                                        </IconButton>
                                    </CardActions>
                                </Card>
                            </div>
                        ))}
                    </div>
                    {/*{categories.map(({ id, course }) => (*/}
                    {/*    <Card className={cardStyles.root} id={"courseCard"}>*/}
                    {/*        <CardActionArea>*/}
                    {/*            <CardContent>*/}
                    {/*                <Typography gutterBottom variant="h5" component="h2">*/}
                    {/*                    {course}*/}
                    {/*                </Typography>*/}
                    {/*                <Typography variant="body2" color="textSecondary" component="p">*/}
                    {/*                    Distributed Systems .....*/}
                    {/*                </Typography>*/}
                    {/*            </CardContent>*/}
                    {/*        </CardActionArea>*/}
                    {/*        <CardActions className={"courseOptions"}>*/}
                    {/*            <Button size="small" color="primary">*/}
                    {/*                View*/}
                    {/*            </Button>*/}
                    {/*            <IconButton aria-label="settings">*/}
                    {/*                <MoreVertIcon />*/}
                    {/*            </IconButton>*/}
                    {/*        </CardActions>*/}
                    {/*    </Card>*/}
                    {/*))}*/}
                </Toolbar>
            </AppBar>
        </Paper>
    );
}

MyCourses.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(MyCourses);