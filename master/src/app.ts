/**
 * Main entry point class for the Master process
 */
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { GCloud } from './GCloud';
import { WorkerTracker } from './WorkerTracker';
import { LOGGER } from './Logger';
import { InstanceChecker } from './InstanceChecker';

// Creates a HTTP Express server
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// HTTP route for getting a list of all the instances in the network (meant for debugging)
app.get('/instances', (req, res) => {
  const gcloud = GCloud.getGCloud();

  return res.send({
    thisMaster: {
      responder: gcloud.amIResponder(),
      coordinator: gcloud.amICoordinator(),
      ...gcloud.thisInstance,
    },
    fdbs: gcloud.databaseInstances,
    workers: gcloud.workerInstances,
    masters: gcloud.masterInstances,
  });
});

// HTTP route for getting the next worker to connect to, used by the clients
app.get('/worker', (req, res) => {
  return res.send({
    worker: WorkerTracker.getWorkerTracker().getNextWorker(),
  });
});

// Default route if none of the other routes match
app.use('/', (req, res) => {
  return res.status(404).send(`The request '${req.method} ${req.path}' cannot be resolved.`);
});

// Startup the node server on a port
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  LOGGER.debug(
    `${(process.env.NAME || 'Server').toUpperCase()} started at http://localhost:${PORT}`,
  );

  // Startup all the micro processes that are part of the Master process
  GCloud.makeGCloud();
  WorkerTracker.makeWorkerTracker();
  InstanceChecker.makeInstanceChecker();
});
