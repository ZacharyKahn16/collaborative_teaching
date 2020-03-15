import { exec } from 'shelljs';
import moment from 'moment';
import { LOGGER } from './Logger';
// import { MasterCoordinator } from './masterCoordinator';

const ZONE = 'us-central1-a';
const PROJECT_ID = 'collaborative-teaching';
const INSTANCE_TYPE = {
  MASTER: 'master',
  WORKER: 'worker',
  DATABASE: 'database',
};

const REFRESH_DATA_INTERVAL = 60 * 1000; // 1 min (ms)
const TIME_TILL_ACTIVE = 8 * 60; // 7 min (s)

export const NUM_MASTERS = 2;
export const NUM_WORKERS = 3;
export const NUM_DATABASES = 4;
const WORKER_IDS: number[] = [];
const DATABASE_IDS: number[] = [];

const staticIps = ['35.224.26.195', '35.226.186.203'];

export interface ComputeEngineInstance {
  id: string;
  instanceType: string;
  number: number;
  zone: string;
  machine: string;
  internalIp: string;
  publicIp: string;
  instanceRunning: boolean;

  createdOn?: number;
  initializedOn?: number;
  instanceServing?: boolean;
}

/**
 * Class to interact with GCloud and keep track of its resources
 * Creates new master, worker and database instances if required
 * Deletes instances if they are not in a good state
 */
export class GCloud {
  private static gCloud: GCloud;
  // private masterCoordinator: MasterCoordinator = new MasterCoordinator();

  readonly id = process.env.NAME;
  thisInstance: ComputeEngineInstance | undefined = undefined;
  amIResponder: boolean = false;

  allInstances: ComputeEngineInstance[] = [];
  databaseInstances: ComputeEngineInstance[] = [];
  workerInstances: ComputeEngineInstance[] = [];
  masterInstances: ComputeEngineInstance[] = [];

  // Startup timers for processes
  constructor() {
    for (let i = 0; i < NUM_WORKERS; i++) {
      WORKER_IDS.push(i + 1);
    }

    for (let i = 0; i < NUM_DATABASES; i++) {
      DATABASE_IDS.push(i + 1);
    }

    this.getInstances();

    setInterval(() => {
      this.getInstances();
    }, REFRESH_DATA_INTERVAL);
  }

  getInstances() {
    exec('gcloud compute instances list', { silent: true }, async (code, stdout, stderr) => {
      if (code === 0) {
        const output = stdout
          .trim()
          .split('\n')
          .slice(1);

        const newInstances = [];

        for (const line of output) {
          const words = line.split(/\s+/);

          const id = words[0].trim();
          const zone = words[1].trim();
          const machine = words[2].trim();
          const internalIp = words[3].trim();
          const publicIp = words.length === 5 ? '' : words[4].trim();
          const instanceRunning =
            words.length === 6 ? words[5].trim() === 'RUNNING' : words[4].trim() === 'RUNNING';

          const instance: ComputeEngineInstance = {
            id,
            instanceType: id.split('-')[0],
            number: Number(id.split('-')[1]),
            zone,
            machine,
            internalIp,
            publicIp,
            instanceRunning,
          };

          try {
            const meta = await this.getMetadata(id);
            instance.createdOn = meta.created;
            instance.initializedOn = meta.initialized;
            instance.instanceServing = meta.serving;

            newInstances.push(instance);
          } catch (error) {
            LOGGER.error(error);
          }
        }

        if (newInstances.length > 0) {
          this.allInstances = newInstances;
          this.filterInstances();
        }
      } else {
        LOGGER.error(code, stderr);
      }
    });
  }

  getMetadata(id: string): Promise<any> {
    return new Promise((resolve, reject) => {
      exec(
        `gcloud compute instances describe ${id} --flatten="metadata[]" --zone=${ZONE}`,
        { silent: true },
        (code, stdout, stderr) => {
          const object = {
            created: -1,
            initialized: -1,
            serving: false,
          };

          if (code !== 0 || stderr) {
            LOGGER.error(code, stderr);
            resolve(object);
          }

          let output = stdout
            .trim()
            .split('\n')
            .slice(3);
          output.pop();

          for (let i = 0; i < output.length; i++) {
            const line = output[i];

            if (line.includes('created')) {
              // @ts-ignore
              object.created = Number(output[i + 1].match(/\d+/)[0].trim());
            } else if (line.includes('startup-on')) {
              // @ts-ignore
              object.initialized = Number(output[i + 1].match(/\d+/)[0].trim());
            } else if (line.includes('startup-status')) {
              object.serving = output[i + 1].split('value: ')[1].replace("'", '') === 'running';
            }
          }

          resolve(object);
        },
      );
    });
  }

  filterInstances(): void {
    this.masterInstances = this.allInstances.filter((instance) => {
      return instance.instanceType.includes(INSTANCE_TYPE.MASTER);
    });

    this.workerInstances = this.allInstances.filter((instance) => {
      return instance.instanceType.includes(INSTANCE_TYPE.WORKER);
    });

    this.databaseInstances = this.allInstances.filter((instance) => {
      return instance.instanceType.includes(INSTANCE_TYPE.DATABASE);
    });

    let thisInstance = this.allInstances.filter((instance) => {
      return instance.id === this.id;
    });

    if (thisInstance.length === 1) {
      this.thisInstance = thisInstance[0];

      let amIMain = true;

      for (const instance of this.masterInstances) {
        if (this.thisInstance.number > instance.number) {
          amIMain = false;
        }
      }

      this.amIResponder = amIMain;

      this.healthCheck();
    }
  }

  healthCheck(): void {
    this.checkMasters();
    this.checkWorkers();
    this.checkDatabases();
    this.checkReplication();
  }

  checkMasters(): void {
    if (this.thisInstance !== undefined) {
      if (this.masterInstances.length < NUM_MASTERS) {
        this.createMaster();
      } else {
        const otherMaster = this.masterInstances.filter((instance) => {
          // @ts-ignore
          return instance.id !== this.thisInstance.id;
        });

        for (const master of otherMaster) {
          if (!this.isInstanceHealthGood(master)) {
            this.deleteInstance(master.id);
          }
        }
      }
    }
  }

  checkWorkers(): void {
    if (
      this.thisInstance !== undefined &&
      this.masterInstances.length === NUM_MASTERS &&
      !this.amIResponder
    ) {
      const mastersAvailNums = this.workerInstances.map((instance) => {
        return instance.number;
      });

      const mastersNotAvailNums = WORKER_IDS.filter((num) => {
        return mastersAvailNums.indexOf(num) < 0;
      });

      for (const num of mastersNotAvailNums) {
        this.createWorker(num);
      }

      for (const instance of this.workerInstances) {
        if (!this.isInstanceHealthGood(instance)) {
          this.deleteInstance(instance.id);
        }
      }
    }
  }

  checkDatabases(): void {
    if (
      this.thisInstance !== undefined &&
      this.masterInstances.length === NUM_MASTERS &&
      !this.amIResponder
    ) {
      const databasesAvailNums = this.databaseInstances.map((instance) => {
        return instance.number;
      });

      const databasesNotAvailNums = DATABASE_IDS.filter((num) => {
        return databasesAvailNums.indexOf(num) < 0;
      });

      for (const num of databasesNotAvailNums) {
        this.createDatabase(num);
      }

      for (const instance of this.databaseInstances) {
        if (!this.isInstanceHealthGood(instance)) {
          this.deleteInstance(instance.id);
        }
      }
    }
  }

  createMaster(): void {
    if (this.thisInstance !== undefined) {
      const index = staticIps.indexOf(this.thisInstance.publicIp);
      const nextIndex = index === 0 ? 1 : 0;
      const nextIp = staticIps[nextIndex];
      const nextName = `${INSTANCE_TYPE.MASTER}-${this.thisInstance.number + 1}`;
      LOGGER.debug(`Creating ${nextName}.`);

      const command = `gcloud beta compute --project=${PROJECT_ID} instances create ${nextName} --zone=${ZONE} --machine-type=g1-small --subnet=default --network-tier=PREMIUM --maintenance-policy=MIGRATE --service-account=165250393917-compute@developer.gserviceaccount.com --scopes=https://www.googleapis.com/auth/cloud-platform --tags=http-server --image=ubuntu-minimal-1804-bionic-v20200220 --image-project=ubuntu-os-cloud --boot-disk-size=10GB --boot-disk-type=pd-standard --boot-disk-device-name=${nextName} --no-shielded-secure-boot --shielded-vtpm --shielded-integrity-monitoring --reservation-affinity=any --address=${nextIp} --metadata=startup-script-url=gs://collaborative-teaching.appspot.com/scripts/startup-master.bash,startup-status=initializing,created-on=$(date +%s)`;

      exec(command, { silent: true }, (code, stdout, stderr) => {
        if (code !== 0 || (stderr && stderr.includes('ERROR'))) {
          LOGGER.error(`Creating ${nextName} failed.`, code, stderr);
        }
      });
    }
  }

  checkReplication(): void {
    // if (
    //   this.thisInstance !== undefined &&
    //   this.masterInstances.length === NUM_MASTERS &&
    //   !this.amIResponder
    // ) {
    //   this.masterCoordinator.makeAllFileCopiesConsistent(this.databaseInstances).then();
    //   // ADD ALL OTHER FUNCTION CALLS HERE;
    // }
  }

  createWorker(num: number): void {
    const name = `${INSTANCE_TYPE.WORKER}-${num}`;
    LOGGER.debug(`Creating ${name}.`);

    const command = `gcloud beta compute --project=${PROJECT_ID} instances create ${name} --zone=${ZONE} --machine-type=g1-small --subnet=default --network-tier=PREMIUM --maintenance-policy=MIGRATE --service-account=165250393917-compute@developer.gserviceaccount.com --scopes=https://www.googleapis.com/auth/cloud-platform --tags=http-server --image=ubuntu-minimal-1804-bionic-v20200220 --image-project=ubuntu-os-cloud --boot-disk-size=10GB --boot-disk-type=pd-standard --boot-disk-device-name=${name} --no-shielded-secure-boot --shielded-vtpm --shielded-integrity-monitoring --reservation-affinity=any --metadata=startup-script-url=gs://collaborative-teaching.appspot.com/scripts/startup-worker.bash,startup-status=initializing,created-on=$(date +%s)`;

    exec(command, { silent: true }, (code, stdout, stderr) => {
      if (code !== 0 || (stderr && stderr.includes('ERROR'))) {
        LOGGER.error(`Creating ${name} failed.`, code, stderr);
      }
    });
  }

  createDatabase(num: number): void {
    const name = `${INSTANCE_TYPE.DATABASE}-${num}`;
    LOGGER.debug(`Creating ${name}.`);

    const command = `gcloud beta compute --project=${PROJECT_ID} instances create ${name} --zone=${ZONE} --machine-type=g1-small --subnet=default --network-tier=PREMIUM --maintenance-policy=MIGRATE --service-account=165250393917-compute@developer.gserviceaccount.com --scopes=https://www.googleapis.com/auth/cloud-platform --tags=database-server --image=ubuntu-minimal-1804-bionic-v20200220 --image-project=ubuntu-os-cloud --boot-disk-size=10GB --boot-disk-type=pd-standard --boot-disk-device-name=${name} --no-shielded-secure-boot --shielded-vtpm --shielded-integrity-monitoring --reservation-affinity=any --metadata=startup-script-url=gs://collaborative-teaching.appspot.com/scripts/startup-database.bash,startup-status=initializing,created-on=$(date +%s)`;

    exec(command, { silent: true }, (code, stdout, stderr) => {
      if (code !== 0 || (stderr && stderr.includes('ERROR'))) {
        LOGGER.error(`Creating ${name} failed.`, code, stderr);
      }
    });
  }

  deleteInstance(id: string): void {
    LOGGER.debug(`Deleting instance ${id}.`);
    const command = `gcloud compute --project=${PROJECT_ID} instances delete ${id} --zone=${ZONE}`;

    exec(command, { silent: true }, (code, stdout, stderr) => {
      if (code !== 0 || stderr) {
        LOGGER.error(`Deleting instance ${id} failed.`, code, stderr);
      }
    });
  }

  isInstanceHealthGood(instance: ComputeEngineInstance): boolean {
    let val = false;
    let message = '';

    if (!instance.createdOn || Number.isNaN(instance.createdOn) || instance.createdOn === -1) {
      val = true;
      message = `Instance ${instance.id} health = GOOD. Has been created but not yet initialized.`;
    } else if (instance.instanceRunning && (instance.instanceServing as boolean)) {
      val = true;
      message = `Instance ${instance.id} health = GOOD. Has been created and is now serving.`;
    } else {
      val = moment().unix() <= instance.createdOn + TIME_TILL_ACTIVE;
    }

    if (message.length === 0) {
      if (val) {
        message = `Instance ${instance.id} health = GOOD. Has been created but not yet initialized.`;
      } else {
        message = `Instance ${instance.id} health = BAD. Has been created, should be serving, but is not serving.`;
      }
    }

    if (val) {
      LOGGER.info(message, instance);
    } else {
      LOGGER.error(message, instance);
    }

    return val;
  }

  static makeGCloud() {
    if (GCloud.gCloud === undefined) {
      GCloud.gCloud = new GCloud();
    }
  }

  static getGCloud(): GCloud {
    if (GCloud.gCloud === undefined) {
      GCloud.makeGCloud();
    }

    return GCloud.gCloud;
  }
}
