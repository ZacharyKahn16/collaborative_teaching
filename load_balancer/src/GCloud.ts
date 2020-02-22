import { exec } from 'shelljs';
import moment from 'moment';

const ZONE = 'us-central1-a';
const PROJECT_ID = 'collaborative-teaching';
const INSTANCE_TYPE = {
  BALANCER: 'loadbalancer',
  MASTER: 'master',
  DATABASE: 'database',
};

const REFRESH_DATA_INTERVAL = 1.5 * 60 * 1000; // 90 sec (ms)
const TIME_TILL_ACTIVE = 8 * 60; // 7 min (s)

const NUM_BALANCERS = 2;
const NUM_MASTERS = 3;
const NUM_DATABASES = 4;
const MASTER_IDS: number[] = [];
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
 */
export class GCloud {
  readonly id = process.env.NAME;
  thisInstance: ComputeEngineInstance | undefined = undefined;
  amIMainBalancer: boolean = false;

  allInstances: ComputeEngineInstance[] = [];
  databaseInstances: ComputeEngineInstance[] = [];
  masterInstances: ComputeEngineInstance[] = [];
  loadBalancerInstances: ComputeEngineInstance[] = [];

  constructor() {
    for (let i = 0; i < NUM_MASTERS; i++) {
      MASTER_IDS.push(i + 1);
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
            console.error(error);
          }
        }

        if (newInstances.length > 0) {
          this.allInstances = newInstances;
          this.filterInstances();
        }
      } else {
        console.error(`Error ${code}: ${stderr}`);
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
            console.error(stderr ? stderr : `Error getting metadata for ${id}`);
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
    this.loadBalancerInstances = this.allInstances.filter((instance) => {
      return instance.instanceType.includes(INSTANCE_TYPE.BALANCER);
    });

    this.masterInstances = this.allInstances.filter((instance) => {
      return instance.instanceType.includes(INSTANCE_TYPE.MASTER);
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

      for (const instance of this.loadBalancerInstances) {
        if (this.thisInstance.number > instance.number) {
          amIMain = false;
        }
      }

      this.amIMainBalancer = amIMain;

      this.healthCheck();
    }
  }

  healthCheck(): void {
    this.checkOtherLoadBalancer();
    this.checkMasters();
  }

  checkOtherLoadBalancer(): void {
    if (this.thisInstance !== undefined) {
      if (this.loadBalancerInstances.length < NUM_BALANCERS) {
        this.createLoadBalancer();
      } else {
        const otherBalancers = this.loadBalancerInstances.filter((instance) => {
          // @ts-ignore
          return instance.id !== this.thisInstance.id;
        });

        for (const balancer of otherBalancers) {
          if (!this.isInstanceGood(balancer)) {
            this.deleteInstance(balancer.id);
          }
        }
      }
    }
  }

  checkMasters(): void {
    if (
      this.thisInstance !== undefined &&
      this.loadBalancerInstances.length === NUM_BALANCERS &&
      !this.amIMainBalancer
    ) {
      const mastersAvailNums = this.masterInstances.map((instance) => {
        return instance.number;
      });

      const mastersNotAvailNums = MASTER_IDS.filter((num) => {
        return mastersAvailNums.indexOf(num) < 0;
      });

      for (const num of mastersNotAvailNums) {
        this.createMaster(num);
      }

      for (const instance of this.masterInstances) {
        if (!this.isInstanceGood(instance)) {
          this.deleteInstance(instance.id);
        }
      }
    }
  }

  checkDatabases(): void {
    if (
      this.thisInstance !== undefined &&
      this.loadBalancerInstances.length === NUM_BALANCERS &&
      !this.amIMainBalancer
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
        if (!this.isInstanceGood(instance)) {
          this.deleteInstance(instance.id);
        }
      }
    }
  }

  createLoadBalancer(): void {
    if (this.thisInstance !== undefined) {
      const index = staticIps.indexOf(this.thisInstance.publicIp);
      const nextIndex = index === 0 ? 1 : 0;
      const nextIp = staticIps[nextIndex];
      const nextName = `${INSTANCE_TYPE.BALANCER}-${this.thisInstance.number + 1}`;

      const command = `gcloud beta compute --project=${PROJECT_ID} instances create ${nextName} --zone=${ZONE} --machine-type=f1-micro --subnet=default --network-tier=PREMIUM --maintenance-policy=MIGRATE --service-account=165250393917-compute@developer.gserviceaccount.com --scopes=https://www.googleapis.com/auth/cloud-platform --tags=http-server --image=ubuntu-minimal-1804-bionic-v20200131 --image-project=ubuntu-os-cloud --boot-disk-size=10GB --boot-disk-type=pd-standard --boot-disk-device-name=${nextName} --no-shielded-secure-boot --shielded-vtpm --shielded-integrity-monitoring --reservation-affinity=any --address=${nextIp} --metadata=startup-script-url=gs://collaborative-teaching.appspot.com/scripts/startup-loadbalancer.bash,startup-status=initializing,created-on=$(date +%s)`;

      exec(command, { silent: true }, (code, stdout, stderr) => {
        if (code !== 0 || stderr) {
          console.error(`Creating Load Balancer failed - ${code}: ${stderr}`);
        }
      });
    }
  }

  createMaster(num: number): void {
    const name = `${INSTANCE_TYPE.MASTER}-${num}`;

    const command = `gcloud beta compute --project=${PROJECT_ID} instances create ${name} --zone=${ZONE} --machine-type=f1-micro --subnet=default --network-tier=PREMIUM --maintenance-policy=MIGRATE --service-account=165250393917-compute@developer.gserviceaccount.com --scopes=https://www.googleapis.com/auth/cloud-platform --tags=http-server --image=ubuntu-minimal-1804-bionic-v20200131 --image-project=ubuntu-os-cloud --boot-disk-size=10GB --boot-disk-type=pd-standard --boot-disk-device-name=${name} --no-shielded-secure-boot --shielded-vtpm --shielded-integrity-monitoring --reservation-affinity=any --metadata=startup-script-url=gs://collaborative-teaching.appspot.com/scripts/startup-master.bash,startup-status=initializing,created-on=$(date +%s)`;

    exec(command, { silent: true }, (code, stdout, stderr) => {
      if (code !== 0 || stderr) {
        console.error(`Creating Master failed - ${code}: ${stderr}`);
      }
    });
  }

  createDatabase(num: number): void {
    const name = `${INSTANCE_TYPE.DATABASE}-${num}`;

    const command = `gcloud beta compute --project=${PROJECT_ID} instances create ${name} --zone=${ZONE} --machine-type=f1-micro --subnet=default --network-tier=PREMIUM --maintenance-policy=MIGRATE --service-account=165250393917-compute@developer.gserviceaccount.com --scopes=https://www.googleapis.com/auth/cloud-platform --tags=database-server --image=ubuntu-minimal-1804-bionic-v20200131 --image-project=ubuntu-os-cloud --boot-disk-size=10GB --boot-disk-type=pd-standard --boot-disk-device-name=${name} --no-shielded-secure-boot --shielded-vtpm --shielded-integrity-monitoring --reservation-affinity=any --metadata=startup-script-url=gs://collaborative-teaching.appspot.com/scripts/startup-database.bash,startup-status=initializing,created-on=$(date +%s)`;

    exec(command, { silent: true }, (code, stdout, stderr) => {
      if (code !== 0 || stderr) {
        console.error(`Creating Database failed - ${code}: ${stderr}`);
      }
    });
  }

  deleteInstance(id: string): void {
    const command = `gcloud compute --project=${PROJECT_ID} instances delete ${id} --zone=${ZONE}`;

    exec(command, { silent: true }, (code, stdout, stderr) => {
      if (code !== 0 || stderr) {
        console.error(`Deleting node failed - ${code}: ${stderr}`);
      }
    });
  }

  isInstanceGood(instance: ComputeEngineInstance): boolean {
    if (!instance.createdOn || Number.isNaN(instance.createdOn) || instance.createdOn === -1) {
      return true;
    }

    if (instance.instanceRunning && (instance.instanceServing as boolean)) {
      return true;
    }

    const now = moment().unix();
    return now <= instance.createdOn + TIME_TILL_ACTIVE;
  }
}

let gcloud: GCloud;

export function makeGCloud(): void {
  gcloud = new GCloud();
}

export function getGCloud(): GCloud {
  if (gcloud === undefined) {
    makeGCloud();
  }

  return gcloud;
}
