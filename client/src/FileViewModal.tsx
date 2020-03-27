import React, { Component } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Theme,
  createStyles,
  IconButton,
  withStyles,
} from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";

export const fileViewModalStyles = (theme: Theme) =>
  createStyles({
    dialog: {
      overflowY: "auto",
    },
    closeButton: {
      position: "absolute",
      right: theme.spacing(1),
      top: theme.spacing(1),
    },
    iFrame: {
      width: "100%",
      height: "80vh",
    },
  });

interface FileViewModalPropType {
  open: boolean;
  onClose: () => void;
  fileContent: string;
  fileName: string;
  classes: any;
}

class FileViewModal extends Component<FileViewModalPropType> {
  componentDidMount() {}

  render() {
    const { classes, open, fileName, fileContent, onClose } = this.props;
    console.log(fileContent);
    return (
      <Dialog
        className={classes.dialog}
        open={open}
        onClose={onClose}
        fullWidth={true}
        disableBackdropClick={true}
        disableEscapeKeyDown={false}
      >
        <IconButton
          className={classes.closeButton}
          onClick={onClose}
          color="inherit"
        >
          <CloseIcon />
        </IconButton>
        <DialogTitle>{fileName}</DialogTitle>
        <DialogContent>
          testing
          {/*<iframe src={fileContent} className={classes.iFrame} />*/}
        </DialogContent>
      </Dialog>
    );
  }
}

export default withStyles(fileViewModalStyles)(FileViewModal);
