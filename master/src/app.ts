import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

const app = express();

app.use(cors());
app.use(morgan('short'));

import { createServer } from 'http';
const server = createServer(app);
import io from 'socket.io';

const ioServer = io(server);

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
