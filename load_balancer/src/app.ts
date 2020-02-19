import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import asyncHandler from 'express-async-handler';
import socket from 'socket.io';

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('short'));

//App setup
const server = app.listen(3000, () => {
  console.log('listening to requests on port 4000');
});

//Static files
app.use(express.static('public'));

//Socket Setup
const io = socket(server);
io.on('connection', () => {
  console.log('make socket connection');
});

export default app;
