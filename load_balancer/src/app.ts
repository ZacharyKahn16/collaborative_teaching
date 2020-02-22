import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import asyncHandler from 'express-async-handler';
import { makeGCloud, getGCloud } from './GCloud';

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/network', (req, res) => {
  const gcloud = getGCloud();
  return res.send({
    this: gcloud.thisInstance,
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
