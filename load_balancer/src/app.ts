import { makeGCloud, getGCloud } from './lib/GCloud';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import asyncHandler from 'express-async-handler';

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/env', (req, res) => {
  return res.send(process.env);
});

app.get('/instances', (req, res) => {
  const gcloud = getGCloud();
  return res.send({
    all: gcloud.allInstances,
    db: gcloud.databaseInstances,
    master: gcloud.masterInstances,
    lb: gcloud.loadBalancerInstances,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  makeGCloud();
  console.debug(`Server started at http://localhost:${PORT}`);
});
