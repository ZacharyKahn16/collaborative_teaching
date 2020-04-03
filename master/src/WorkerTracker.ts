import { GCloud, ComputeEngineInstance } from './GCloud';

export class WorkerTracker {
  static workerTracker: WorkerTracker;

  gcloud: GCloud;
  lastWorker: ComputeEngineInstance | undefined = undefined;

  constructor() {
    this.gcloud = GCloud.getGCloud();
    this.getWorkers();
  }

  getWorkers(): ComputeEngineInstance[] {
    return this.gcloud.workerInstances.filter((instance) => {
      return (
        this.gcloud.isInstanceHealthGood(instance) &&
        instance.instanceRunning &&
        instance.instanceServing === true
      );
    });
  }

  getNextWorker(): ComputeEngineInstance | null {
    if (!this.gcloud.amIResponder()) {
      return null;
    }

    const workers = this.getWorkers();

    if (workers.length === 0) {
      return null;
    }

    if (this.lastWorker === null) {
      this.lastWorker = workers[0];
      return this.lastWorker;
    }

    if (workers.length === 1) {
      this.lastWorker = workers[0];
      return this.lastWorker;
    }

    const currentMasterIndex = workers.findIndex((instance) => {
      return this.lastWorker ? this.lastWorker.id === instance.id : -1;
    });

    if (currentMasterIndex < 0) {
      this.lastWorker = workers[0];
      return this.lastWorker;
    }

    let nextIndex = currentMasterIndex + 1;
    if (nextIndex < workers.length) {
      this.lastWorker = workers[nextIndex];
      return this.lastWorker;
    }

    nextIndex = 0;
    this.lastWorker = workers[nextIndex];
    return this.lastWorker;
  }

  static makeWorkerTracker() {
    if (WorkerTracker.workerTracker === undefined) {
      WorkerTracker.workerTracker = new WorkerTracker();
    }
  }

  static getWorkerTracker() {
    if (WorkerTracker.workerTracker === undefined) {
      WorkerTracker.makeWorkerTracker();
    }

    return WorkerTracker.workerTracker;
  }
}
