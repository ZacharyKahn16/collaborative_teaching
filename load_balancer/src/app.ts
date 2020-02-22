import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import { makeGCloud, getGCloud } from './GCloud';
import { makeMasterTracker, getMasterTracker } from './MasterTracker';

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/instances', (req, res) => {
  const gcloud = getGCloud();
  return res.send({
    thisInstance: {
      mainBalancer: gcloud.amIMainBalancer,
      ...gcloud.thisInstance,
    },
    db: gcloud.databaseInstances,
    master: gcloud.masterInstances,
    lb: gcloud.loadBalancerInstances,
  });
});

app.get('/master', (req, res) => {
  const masterTracker = getMasterTracker();

  return res.send({
    master: masterTracker.getNextMaster(),
  });
});

app.use('/', (req, res) => {
  return res.status(404).send(`The request '${req.method} ${req.path}' cannot be resolved.`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  makeGCloud();
  makeMasterTracker();
  console.debug(`Server started at http://localhost:${PORT}`);
});
