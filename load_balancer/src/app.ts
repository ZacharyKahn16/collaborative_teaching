/* tslint:disable */
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { createServer } from 'http';

//Change the mock data to real list of masters queried from the database
import { mockData } from './mockServerData';

const app = express();
app.use(cors());
app.use(morgan('short'));

const server = createServer(app);

server.on('connection', (socket) => {
  console.log('New conneection...');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.debug(`Server started at http://localhost:${PORT}`);
});

//TODO: Change this to real master list
const masterList: any = mockData

const getNextMaster = (): any => {
  const nextMaster = masterList.shift();
  masterList.push(nextMaster);
  
  return nextMaster;
};

app.get('/', function(req, res) {
  res.send(getNextMaster());
});

