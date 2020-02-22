// Creates a express application
import express from 'express';
const app = express();
// Creates an http server using express
import { createServer } from 'http';
const server = createServer(app);

// Creates a web socket on this server
import io from 'socket.io';
const ioServer = io(server);

import cors from 'cors';
import morgan from 'morgan';
app.use(cors());
app.use(morgan('short'));

app.get('/', function(req, res) {
  res.sendFile(`${__dirname}/index.html`);
});

ioServer.on('connection', function(socket) {
  console.log('a user connected');
  socket.on('disconnect', function() {
    console.log('user disconnected');
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.debug(`Server started at http://localhost:${PORT}`);
});
