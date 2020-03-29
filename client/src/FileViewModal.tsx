import React, { useContext, useEffect, useCallback, useState } from "react";
import { v4 } from "uuid";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Theme,
  createStyles,
  IconButton,
  makeStyles,
  DialogContentText,
} from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import { GlobalContext } from "./GlobalContext";

const fileViewModalStyles = makeStyles((theme: Theme) => {
  return createStyles({
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
});

const FileViewModal = () => {
  const classes = fileViewModalStyles();
  const { responses, selectedFileId, setSelectedFileId, network } = useContext(GlobalContext);

  const [fileName, setFileName] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [fileHash, setFileHash] = useState("");

  const [timeout, setTimeout] = useState<number | undefined>(undefined);
  const [reqId, setReqId] = useState("");

  function onClose() {
    setSelectedFileId("");
    setFileName("");
    setFileContent("");
    setFileHash("");
    setReqId("");
    window.clearTimeout(timeout);
  }

  function renderContent() {
    if (!fileContent) {
      return <DialogContentText>Trying to retrieve file...</DialogContentText>;
    } else if (!fileContent.startsWith("data:")) {
      return <DialogContentText>Invalid file format.</DialogContentText>;
    } else {
      return <iframe src={fileContent} className={classes.iFrame} title="File Content" />;
    }
  }

  const getFile = useCallback(() => {
    if (selectedFileId) {
      const rId = v4();
      setReqId(rId);
      network.getFileFromWorker(selectedFileId, rId);
    }
  }, [selectedFileId, network]);

  useEffect(() => {
    getFile();
  }, [getFile]);

  useEffect(() => {
    if (reqId) {
      const find = responses.filter((resp) => {
        return resp.requestId === reqId;
      });

      if (find.length === 1) {
        const resp = find[0];

        const id = window.setTimeout(() => {
          getFile();
        }, 10 * 1000);
        setTimeout(id);

        if (resp.status === "success") {
          const message = resp.message;

          if (message.docId === selectedFileId) {
            setFileName(message.fileName);
            setFileContent(message.fileContents);
            setFileHash(message.fileHash);
          }
        }
      }
    }
  }, [reqId, responses, getFile, selectedFileId]);

  if (!selectedFileId) {
    return null;
  }

  return (
    <Dialog
      className={classes.dialog}
      open={true}
      onClose={onClose}
      fullWidth={true}
      disableBackdropClick={true}
      disableEscapeKeyDown={false}
    >
      <IconButton className={classes.closeButton} onClick={onClose} color="inherit">
        <CloseIcon />
      </IconButton>
      <DialogTitle>{fileName}</DialogTitle>
      <DialogContent>{renderContent()}</DialogContent>
    </Dialog>
  );
};

export default FileViewModal;
