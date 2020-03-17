import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Typography from "@material-ui/core/Typography";
import Link from "@material-ui/core/Link";
import React from "react";
import PropTypes from "prop-types";
import "./Styles/FileList.css";
// import { withStyles } from "@material-ui/core/styles";

function createData(fileName, courseName, owner, dateUploaded) {
  return { fileName, courseName, owner, dateUploaded };
}

const rows = [
  createData("Replication & Fault Tolerance.ppt", "CPSC 559", "Garland Khuu", "02-21-2020"),
  createData("Dynamic Programming.pdf", "CPSC 413", "Garland Khuu", "11-16-2019"),
  createData("Utilitarianism.pdf", "PHIL 249", "Garland Khuu", "09-20-2016"),
  createData("10 Tips for Success in Computer Science.ppt", "", "Garland Khuu", "03-05-2020"),
  createData("Password Hashing.pdf", "CPSC 329", "Garland Khuu", "01-28-2019")
];

const FileList = props => {
  return (
    <TableContainer>
      <Table aria-label="simple table">
        <TableHead>
          <TableRow className="bold">
            <TableCell className="bold" align="left">File Name</TableCell>
            <TableCell className="bold" align="left">Course</TableCell>
            <TableCell className="bold" align="left">Owner</TableCell>
            <TableCell className="bold" align="left">Date Uploaded</TableCell>
            <TableCell className="bold" align="left">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(row => (
            <TableRow key={row.fileName}>
              <TableCell align="left">
                <Typography variant="body2">
                  <Link
                      color="primary"
                      href="#"
                      onClick={() => {
                      }}
                  >
                    {row.fileName}
                  </Link>
                </Typography>
              </TableCell>
              <TableCell align="left">{row.courseName ? row.courseName : "None"}</TableCell>
              <TableCell align="left">{row.owner}</TableCell>
              <TableCell align="left">{row.dateUploaded}</TableCell>
              <TableCell align="left">Actions</TableCell>

            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

FileList.propTypes = {
  classes: PropTypes.object.isRequired
};

export default FileList;
