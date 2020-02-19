import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import socket from 'socket.io';

const app = express();

app.use(cors());
app.use(morgan('short'));

// App setup
const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.debug(`Server started at http://localhost:${PORT}`);
});

// Socket Setup
const io = socket(server);

io.on('connection', () => {
  console.log('make socket connection');
});
