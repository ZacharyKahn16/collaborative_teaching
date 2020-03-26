import React from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import { withStyles } from "@material-ui/core/styles";
import Divider from "@material-ui/core/Divider";
import Drawer from "@material-ui/core/Drawer";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import { Link } from "react-router-dom";
import ExitToAppIcon from "@material-ui/icons/ExitToApp";
import SchoolIcon from "@material-ui/icons/School";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import AccountBalanceIcon from "@material-ui/icons/AccountBalance";
import { AUTH } from "./Firebase";

const categories = [
  {
    children: [
      {
        id: "My Courses",
        icon: <SchoolIcon />,
        path: "/my-courses",
        numIndex: 0
      },
      {
        id: "My Files",
        icon: <FileCopyIcon />,
        path: "/my-files",
        numIndex: 1
      },
      {
        id: "Browse Content Bank",
        icon: <AccountBalanceIcon />,
        path: "/browse-content",
        numIndex: 2
      }
    ]
  }
];

const styles = theme => ({
  categoryHeader: {
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2)
  },
  categoryHeaderPrimary: {
    color: theme.palette.common.white
  },
  item: {
    paddingTop: 10,
    paddingBottom: 10,
    color: "rgba(255, 255, 255, 0.7)",
    "&:hover,&:focus": {
      backgroundColor: "rgba(255, 255, 255, 0.08)"
    }
  },
  itemCategory: {
    backgroundColor: "#232f3e",
    boxShadow: "0 -1px 0 #404854 inset",
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2)
  },
  firebase: {
    userSelect: "none",
    fontSize: 24,
    color: theme.palette.common.white
  },
  itemActiveItem: {
    color: "#4fc3f7"
  },
  itemPrimary: {
    fontSize: "inherit"
  },
  itemIcon: {
    minWidth: "auto",
    marginRight: theme.spacing(2)
  },
  divider: {}
});

function Navigator(props) {
  setActiveTab();
  const { classes, ...other } = props;

  function setActiveTab() {
    categories[0].children.forEach(function(element) {
      element.active = window.location.href.includes(element.path);
    });
  }

  function logout() {
    AUTH.signOut().then();
  }

  return (
    <Drawer variant="permanent" {...other}>
      <List disablePadding>
        <ListItem
          className={clsx(classes.firebase, classes.item, classes.itemCategory)}
        >
          Collaborative Teaching
        </ListItem>
        {categories.map(({ id, children }, parentKey) => (
          <React.Fragment key={parentKey}>
            {children.map(
              (
                { id: childId, icon, active, styleid, path, numIndex },
                childKey
              ) => (
                <Link
                  to={path}
                  classes={{
                    primary: classes.itemPrimary
                  }}
                  className={"linkNoStyle"}
                  key={childKey}
                >
                  <div id={styleid}>
                    <ListItem
                      key={childId}
                      button
                      className={clsx(
                        classes.item,
                        active && classes.itemActiveItem
                      )}
                    >
                      <ListItemIcon className={classes.itemIcon}>
                        {icon}
                      </ListItemIcon>

                      {childId}
                    </ListItem>
                  </div>
                </Link>
              )
            )}

            <Divider className={classes.divider} />
          </React.Fragment>
        ))}
        <ListItem button={true} className={clsx(classes.item)} onClick={logout}>
          <ListItemIcon className={classes.itemIcon}>
            <ExitToAppIcon />
          </ListItemIcon>
          Logout
        </ListItem>
        <Divider className={classes.divider} />
      </List>
    </Drawer>
  );
}

Navigator.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(Navigator);
