import { exec } from 'shelljs';
import moment from 'moment';
import { LOGGER } from './Logger';
import { MasterCoordinator } from './masterCoordinator';

/* eslint-disable @typescript-eslint/ban-ts-ignore */
const ZONE = 'us-central1-a';
const PROJECT_ID = 'collaborative-teaching';
const INSTANCE_TYPE = {
  MASTER: 'master',
  WORKER: 'worker',
  DATABASE: 'database',
};

const REFRESH_DATA_INTERVAL = 30 * 1000; // 30 secs
const CONSISTENT_INTERVAL = 45 * 1000; // 45 secs
const TIME_TILL_ACTIVE = 2.75 * 60; // 2.75 min (s)

export const NUM_MASTERS = 3; // Number of masters in the system
export const NUM_WORKERS = 3; // Number of workers in the system
export const NUM_DATABASES = 4; // Number of FileDatabases in the system
const MASTER_IDS: number[] = [];
const WORKER_IDS: number[] = [];
const DATABASE_IDS: number[] = [];

// List of Static IPs available to be used by the Masters
const STATIC_IPS = ['35.224.26.195', '35.226.186.203', '35.226.103.161'];

// Defines an interface for a VM instance in GCP, lists all the metadata available for it
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
 * Follows a Object Oriented singleton design pattern
 */
export class GCloud {
  private static gCloud: GCloud; // singleton instance
  private masterCoordinator: MasterCoordinator = new MasterCoordinator();

  readonly id = process.env.NAME;
  thisInstance: ComputeEngineInstance | undefined = undefined;

  allInstances: ComputeEngineInstance[] = [];
  databaseInstances: ComputeEngineInstance[] = [];
  workerInstances: ComputeEngineInstance[] = [];
  masterInstances: ComputeEngineInstance[] = [];

  // Startup timers for processes
  constructor() {
    for (let i = 0; i < NUM_MASTERS; i++) {
      MASTER_IDS.push(i + 1);
    }

    for (let i = 0; i < NUM_WORKERS; i++) {
      WORKER_IDS.push(i + 1);
    }

    for (let i = 0; i < NUM_DATABASES; i++) {
      DATABASE_IDS.push(i + 1);
    }

    this.getInstances();

    // Update all the data available from GCP DNS, at the interval defined
    setInterval(() => {
      this.getInstances();
    }, REFRESH_DATA_INTERVAL);

    // Check the FileDatabase replication and consistency, at the interval defined
    setInterval(() => {
      this.replicationCheck();
    }, CONSISTENT_INTERVAL);
  }

  /**
   * Get a list of VMs in the GCP DNS
   */
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

          if (!id.includes('website')) {
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
              // eslint-disable-next-line no-await-in-loop
              const meta = await this.getMetadata(id);
              instance.createdOn = meta.created;
              instance.initializedOn = meta.initialized;
              instance.instanceServing = meta.serving;

              newInstances.push(instance);
            } catch (error) {}
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

  /**
   * Get metadata about a specific VM instance
   * @param {string} id
   * @returns {Promise<any>}
   */
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

          const output = stdout
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

  /**
   * Returns whether this Master process is the Responder or not
   * @returns {boolean}
   */
  amIResponder(): boolean {
    if (this.masterInstances.length < 1) {
      return false;
    }

    if (this.masterInstances.length < 2) {
      return true;
    }

    const ids = this.masterInstances.map((instance) => {
      return instance.number;
    });

    return this.thisInstance !== undefined && this.thisInstance.number < Math.max(...ids);
  }

  /**
   * Returns whether this Master process is the Coordinator or not
   * @returns {boolean}
   */
  amICoordinator(): boolean {
    if (this.masterInstances.length < 2) {
      return false;
    }

    const ids = this.masterInstances.map((instance) => {
      return instance.number;
    });

    return this.thisInstance !== undefined && this.thisInstance.number === Math.max(...ids);
  }

  /**
   * Takes a list of all the GCP VM instances and classifies them into their type
   */
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

    const thisInstance = this.allInstances.filter((instance) => {
      return instance.id === this.id;
    });

    if (thisInstance.length === 1) {
      this.thisInstance = thisInstance[0];
      LOGGER.debug(
        `${thisInstance[0].id.toUpperCase()},  Responder: ${this.amIResponder()}, Coordinator: ${this.amICoordinator()}`,
      );

      this.healthCheck();
    }
  }

  /**
   * Checks the health and status of all the instances in the DNS
   */
  healthCheck(): void {
    this.checkMasters();
    this.checkWorkers();
    this.checkDatabases();
  }

  replicationCheck(): void {
    this.checkReplication();
  }

  /**
   * Checks the health for all the other Masters in the DNS
   * Checks whether the network has the correct number of Masters
   */
  checkMasters(): void {
    if (this.thisInstance !== undefined) {
      const mastersAvailNums = this.masterInstances.map((instance) => {
        return instance.number;
      });

      const mastersNotAvailNums = MASTER_IDS.filter((num) => {
        // @ts-ignore
        return mastersAvailNums.indexOf(num) < 0 && this.thisInstance.number !== num;
      });

      for (const num of mastersNotAvailNums) {
        this.createMaster(num);
      }

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

  /**
   * Checks the health for all the other Workers in the DNS
   * Checks whether the network has the correct number of Workers
   * Can only be executed by the Coordinator
   */
  checkWorkers(): void {
    if (this.amICoordinator()) {
      const workersAvailNums = this.workerInstances.map((instance) => {
        return instance.number;
      });

      const workersNotAvailNums = WORKER_IDS.filter((num) => {
        return workersAvailNums.indexOf(num) < 0;
      });

      for (const num of workersNotAvailNums) {
        this.createWorker(num);
      }

      for (const instance of this.workerInstances) {
        if (!this.isInstanceHealthGood(instance)) {
          this.deleteInstance(instance.id);
        }
      }
    }
  }

  /**
   * Checks the health for all the other FileDatabases in the DNS
   * Checks whether the network has the correct number of FileDatabases
   * Can only be executed by the Coordinator
   */
  checkDatabases(): void {
    if (this.amICoordinator()) {
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

  /**
   * Checks the file replication and consistency for all the files in all the FileDatabases
   * Can only be executed by the Coordinator
   */
  async checkReplication(): Promise<void> {
    if (this.amICoordinator()) {
      const ips = this.databaseInstances
        .filter((instance) => {
          return (
            this.isInstanceHealthGood(instance) &&
            instance.instanceServing === true &&
            instance.instanceRunning
          );
        })
        .map((instance) => {
          return instance.publicIp;
        });

      try {
        await this.masterCoordinator.makeAllFileCopiesConsistent(ips);
      } catch (err) {}

      try {
        await this.masterCoordinator.makeCorrectNumberOfReplicas(ips);
      } catch (err) {}

      try {
        await this.masterCoordinator.populateEmptyFdbs(ips);
      } catch (err) {}

      try {
        await this.masterCoordinator.makeMCDBWithCorrectInfo(ips);
      } catch (err) {}
    }
  }

  /**
   * Creates a Master with the given number/id
   * @param {number} num
   */
  createMaster(num: number): void {
    const name = `${INSTANCE_TYPE.MASTER}-${num}`;
    const ip = STATIC_IPS[num - 1];
    // @ts-ignore
    LOGGER.debug(`${this.thisInstance.id.toUpperCase()} is creating ${name.toUpperCase()}`);

    const command = `gcloud beta compute --project=${PROJECT_ID} instances create ${name} --zone=${ZONE} --machine-type=n1-standard-8 --subnet=default --network-tier=PREMIUM --maintenance-policy=MIGRATE --service-account=165250393917-compute@developer.gserviceaccount.com --scopes=https://www.googleapis.com/auth/cloud-platform --tags=http-server --image=ubuntu-minimal-1804-bionic-v20200317 --image-project=ubuntu-os-cloud --boot-disk-size=10GB --boot-disk-type=pd-standard --boot-disk-device-name=${name} --no-shielded-secure-boot --shielded-vtpm --shielded-integrity-monitoring --reservation-affinity=any --address=${ip} --metadata=startup-script-url=gs://collaborative-teaching.appspot.com/scripts/startup-master.bash,startup-status=initializing,created-on=$(date +%s)`;
    exec(command, { silent: true }, (code, stdout, stderr) => {
      if (code !== 0 || (stderr && stderr.includes('ERROR'))) {
        LOGGER.error(`${name} - creating failed.`, code, stderr);
      }
    });
  }

  /**
   * Creates a Worker with the given number/id
   * @param {number} num
   */
  createWorker(num: number): void {
    const name = `${INSTANCE_TYPE.WORKER}-${num}`;
    // @ts-ignore
    LOGGER.debug(`${this.thisInstance.id.toUpperCase()} is creating ${name.toUpperCase()}`);

    const command = `gcloud beta compute --project=${PROJECT_ID} instances create ${name} --zone=${ZONE} --machine-type=n1-standard-2 --subnet=default --network-tier=PREMIUM --maintenance-policy=MIGRATE --service-account=165250393917-compute@developer.gserviceaccount.com --scopes=https://www.googleapis.com/auth/cloud-platform --tags=http-server --image=ubuntu-minimal-1804-bionic-v20200317 --image-project=ubuntu-os-cloud --boot-disk-size=10GB --boot-disk-type=pd-standard --boot-disk-device-name=${name} --no-shielded-secure-boot --shielded-vtpm --shielded-integrity-monitoring --reservation-affinity=any --metadata=startup-script-url=gs://collaborative-teaching.appspot.com/scripts/startup-worker.bash,startup-status=initializing,created-on=$(date +%s)`;
    exec(command, { silent: true }, (code, stdout, stderr) => {
      if (code !== 0 || (stderr && stderr.includes('ERROR'))) {
        LOGGER.error(`${name} - creating failed.`, code, stderr);
      }
    });
  }

  /**
   * Creates a FileDatabase with the given number/id
   * @param {number} num
   */
  createDatabase(num: number): void {
    const name = `${INSTANCE_TYPE.DATABASE}-${num}`;
    // @ts-ignore
    LOGGER.debug(`${this.thisInstance.id.toUpperCase()} is creating ${name.toUpperCase()}`);

    const command = `gcloud beta compute --project=${PROJECT_ID} instances create ${name} --zone=${ZONE} --machine-type=n1-standard-2 --subnet=default --network-tier=PREMIUM --maintenance-policy=MIGRATE --service-account=165250393917-compute@developer.gserviceaccount.com --scopes=https://www.googleapis.com/auth/cloud-platform --tags=database-server --image=ubuntu-minimal-1804-bionic-v20200317 --image-project=ubuntu-os-cloud --boot-disk-size=10GB --boot-disk-type=pd-standard --boot-disk-device-name=${name} --no-shielded-secure-boot --shielded-vtpm --shielded-integrity-monitoring --reservation-affinity=any --metadata=startup-script-url=gs://collaborative-teaching.appspot.com/scripts/startup-database.bash,startup-status=initializing,created-on=$(date +%s)`;
    exec(command, { silent: true }, (code, stdout, stderr) => {
      if (code !== 0 || (stderr && stderr.includes('ERROR'))) {
        LOGGER.error(`${name} - creating failed.`, code, stderr);
      }
    });
  }

  /**
   * Kills the VM in the network with the given id
   * @param {string} id
   */
  deleteInstance(id: string): void {
    // @ts-ignore
    LOGGER.debug(`${this.thisInstance.id.toUpperCase()} is deleting ${id.toUpperCase()}`);

    const command = `yes | gcloud compute --project=${PROJECT_ID} instances delete ${id} --zone=${ZONE}`;
    exec(command, { silent: true }, (code, stdout, stderr) => {});
  }

  /**
   * Does a quick health check on a VM instance using the GCP DNS
   * @param {ComputeEngineInstance} instance
   * @param {boolean} log
   * @returns {boolean}
   */
  isInstanceHealthGood(instance: ComputeEngineInstance, log: boolean = true): boolean {
    let val = false;
    let message = '';

    if (!instance.createdOn || Number.isNaN(instance.createdOn) || instance.createdOn === -1) {
      val = true;
      message = `${instance.id} health is GOOD, has been created but not yet initialized.`;
    } else if (instance.instanceRunning && (instance.instanceServing as boolean)) {
      val = true;
      message = `${instance.id} health is GOOD, and is serving.`;
    } else {
      val = moment().unix() <= instance.createdOn + TIME_TILL_ACTIVE;
    }

    if (message.length === 0) {
      if (val) {
        message = `${instance.id} health is GOOD, has been created but not yet initialized.`;
      } else {
        message = `${instance.id} health is BAD, has been created, should be serving, but is not serving.`;
      }
    }

    if (log && this.amICoordinator()) {
      if (val) {
        LOGGER.info(message);
      } else {
        LOGGER.error(message);
      }
    }

    return val;
  }

  /**
   * Instantiates the singleton
   */
  static makeGCloud() {
    if (GCloud.gCloud === undefined) {
      GCloud.gCloud = new GCloud();
    }
  }

  /**
   * Returns a reference to the singleton GCloud instance
   * @returns {GCloud}
   */
  static getGCloud(): GCloud {
    if (GCloud.gCloud === undefined) {
      GCloud.makeGCloud();
    }

    return GCloud.gCloud;
  }
}
