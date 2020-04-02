import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { GCloud } from './GCloud';
import { WorkerTracker } from './WorkerTracker';
import { LOGGER } from './Logger';
import { InstanceChecker } from './InstanceChecker';

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/instances', (req, res) => {
  const gcloud = GCloud.getGCloud();

  return res.send({
    thisMaster: {
      responder: gcloud.amIResponder,
      coordinator: !gcloud.amIResponder,
      ...gcloud.thisInstance,
    },
    fdbs: gcloud.databaseInstances,
    workers: gcloud.workerInstances,
    masters: gcloud.masterInstances,
  });
});

app.get('/worker', (req, res) => {
  return res.send({
    worker: WorkerTracker.getWorkerTracker().getNextWorker(),
  });
});

app.use('/', (req, res) => {
  return res.status(404).send(`The request '${req.method} ${req.path}' cannot be resolved.`);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  LOGGER.debug(
    `${(process.env.NAME || 'Server').toUpperCase()} started at http://localhost:${PORT}`,
  );
  GCloud.makeGCloud();
  WorkerTracker.makeWorkerTracker();
  InstanceChecker.makeInstanceChecker();
});
