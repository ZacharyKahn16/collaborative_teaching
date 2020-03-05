import { GCloud, ComputeEngineInstance } from './GCloud';

export class WorkerTracker {
  static workerTracker: WorkerTracker;

  gcloud: GCloud;
  workerInstances: ComputeEngineInstance[] = [];
  lastWorker: ComputeEngineInstance | null = null;

  constructor() {
    this.gcloud = GCloud.getGCloud();
    this.getWorkers();
  }

  getWorkers(): void {
    this.workerInstances = [...this.gcloud.workerInstances];
  }

  getNextWorker(): ComputeEngineInstance | null {
    if (!this.gcloud.amIResponder) {
      return null;
    }

    this.getWorkers();

    if (this.workerInstances.length === 0) {
      return null;
    }

    if (this.lastWorker === null) {
      this.lastWorker = this.workerInstances[0];
      return this.lastWorker;
    }

    if (this.workerInstances.length === 1) {
      this.lastWorker = this.workerInstances[0];
      return this.lastWorker;
    }

    const currentMasterIndex = this.workerInstances.findIndex((instance) => {
      // @ts-ignore
      return this.lastWorker.id === instance.id;
    });

    if (currentMasterIndex < 0) {
      this.lastWorker = this.workerInstances[0];
      return this.lastWorker;
    }

    let nextIndex = currentMasterIndex + 1;
    if (nextIndex < this.workerInstances.length - 1) {
      this.lastWorker = this.workerInstances[nextIndex];
      return this.lastWorker;
    }

    nextIndex = 0;
    this.lastWorker = this.workerInstances[nextIndex];
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
