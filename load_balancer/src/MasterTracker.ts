import { GCloud, getGCloud, ComputeEngineInstance } from './GCloud';

class MasterTracker {
  gcloud: GCloud;
  masterInstances: ComputeEngineInstance[] = [];
  lastMaster: ComputeEngineInstance | null = null;

  constructor() {
    this.gcloud = getGCloud();
    this.getMasters();
  }

  getMasters(): void {
    this.masterInstances = [...this.gcloud.masterInstances];
  }

  getNextMaster(): ComputeEngineInstance | null {
    if (!this.gcloud.amIMainBalancer) {
      return null;
    }

    this.getMasters();

    if (this.masterInstances.length === 0) {
      return null;
    }

    if (this.lastMaster === null) {
      this.lastMaster = this.masterInstances[0];
      return this.lastMaster;
    }

    if (this.masterInstances.length === 1) {
      this.lastMaster = this.masterInstances[0];
      return this.lastMaster;
    }

    const currentMasterIndex = this.masterInstances.findIndex((instance) => {
      // @ts-ignore
      return this.lastMaster.id === instance.id;
    });

    if (currentMasterIndex < 0) {
      this.lastMaster = this.masterInstances[0];
      return this.lastMaster;
    }

    let nextIndex = currentMasterIndex + 1;
    if (nextIndex < this.masterInstances.length - 1) {
      this.lastMaster = this.masterInstances[nextIndex];
      return this.lastMaster;
    }

    nextIndex = 0;
    this.lastMaster = this.masterInstances[nextIndex];
    return this.lastMaster;
  }
}

let masterTracker: MasterTracker;

export function makeMasterTracker(): void {
  masterTracker = new MasterTracker();
}

export function getMasterTracker(): MasterTracker {
  if (masterTracker === undefined) {
    makeMasterTracker();
  }

  return masterTracker;
}
