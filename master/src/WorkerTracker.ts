import { GCloud, ComputeEngineInstance } from './GCloud';

/**
 * Class that tracks all the Workers and does a round robin selection from all the workers available
 * Follows a Object Oriented singleton design pattern
 * This class is responsible for returning information about a Worker when requested by a Client
 */
export class WorkerTracker {
  static workerTracker: WorkerTracker; // singleton instance

  // a reference to the the GCloud class, that WorkerTracker depends on
  gcloud: GCloud;

  // last worker selected starts off as undefined
  lastWorker: ComputeEngineInstance | undefined = undefined;

  constructor() {
    // get the GCloud reference and store it inside this class
    this.gcloud = GCloud.getGCloud();
    this.getWorkers();
  }

  /**
   * Method that communicates with the GCloud class and returns a list of Workers
   * Only Workers that are healthy and active are returned
   * @returns {ComputeEngineInstance[]}
   */
  getWorkers(): ComputeEngineInstance[] {
    return this.gcloud.workerInstances.filter((instance) => {
      return (
        this.gcloud.isInstanceHealthGood(instance) &&
        instance.instanceRunning &&
        instance.instanceServing === true
      );
    });
  }

  /**
   * Method that returns the next available Worker in the round robin queue
   * Returns NULL if no Workers are available
   * Returns information about a Worker, if at least 1 Worker available
   * @returns {ComputeEngineInstance | null}
   */
  getNextWorker(): ComputeEngineInstance | null {
    // If this Master is not the Responder, return
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

  /**
   * Instantiates the singleton
   */
  static makeWorkerTracker() {
    if (WorkerTracker.workerTracker === undefined) {
      WorkerTracker.workerTracker = new WorkerTracker();
    }
  }

  /**
   * Returns a reference to the singleton WorkerTracker instance
   * @returns {WorkerTracker}
   */
  static getWorkerTracker() {
    if (WorkerTracker.workerTracker === undefined) {
      WorkerTracker.makeWorkerTracker();
    }

    return WorkerTracker.workerTracker;
  }
}
