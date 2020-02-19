import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { createServer } from 'http';
import io from 'socket.io';
import { listAppInstances, listComputeInstances } from './NetworkInfo';

const app = express();
app.use(cors());
app.use(morgan('short'));

const server = createServer(app);
const ioServer = io(server);

setInterval(() => {
  listComputeInstances();
  listAppInstances();
}, 1000);

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
