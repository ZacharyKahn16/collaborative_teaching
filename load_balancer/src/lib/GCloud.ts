import { exec } from 'shelljs';

const ZONE = 'us-central1-a';
const PROJECT_ID = 'collaborative-teaching';
const INSTANCE_TYPE = {
  BALANCER: 'loadbalancer',
  MASTER: 'master',
  DATABASE: 'database',
};

const NUM_BALANCERS = 2;
const NUM_MASTERS = 3;
const ONE_MIN = 60 * 1000;
const THIRTY_SEC = 30 * 1000;

const staticIps = ['35.208.223.194', '35.208.193.108'];

interface ComputeEngineInstance {
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
class GCloud {
  readonly name = process.env.NAME;
  amIMainBalancer: boolean = false;

  allInstances: ComputeEngineInstance[] = [];

  databaseInstances: ComputeEngineInstance[] = [];
  masterInstances: ComputeEngineInstance[] = [];
  loadBalancerInstances: ComputeEngineInstance[] = [];

  constructor() {
    this.getInstances();

    setInterval(() => {
      this.getInstances();
    }, ONE_MIN);

    setInterval(() => {
      this.checkIfMainBalancer();
    }, THIRTY_SEC);
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
          if (code !== 0 || stderr) {
            reject(stderr ? stderr : `Error getting metadata for ${id}`);
          }

          let output = stdout
            .trim()
            .split('\n')
            .slice(3);
          output.pop();

          const object = {
            created: -1,
            initialized: -1,
            serving: false,
          };

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
  }

  checkIfMainBalancer(): void {
    if (this.loadBalancerInstances.length < 1) {
      return;
    }

    const thisInstance = this.loadBalancerInstances.filter((instances) => {
      return instances.id === this.name;
    })[0];

    const otherInstances = this.loadBalancerInstances.filter((instances) => {
      return instances.id !== this.name;
    });

    let amIMain = true;

    for (const instance of otherInstances) {
      if (thisInstance.number > instance.number) {
        amIMain = false;
      }
    }

    this.amIMainBalancer = amIMain;
  }

  healthCheck(): void {
    
  }

  createLoadBalancer(num: number): void {
    const name = `${INSTANCE_TYPE.BALANCER}-${num}`;
    const ip = num === 1 ? staticIps[0] : staticIps[1];

    const command = `gcloud beta compute --project=${PROJECT_ID} instances create ${name} --zone=${ZONE} --machine-type=f1-micro --subnet=default --network-tier=PREMIUM --maintenance-policy=MIGRATE --service-account=165250393917-compute@developer.gserviceaccount.com --scopes=https://www.googleapis.com/auth/cloud-platform --tags=http-server --image=ubuntu-minimal-1804-bionic-v20200131 --image-project=ubuntu-os-cloud --boot-disk-size=10GB --boot-disk-type=pd-standard --boot-disk-device-name=loadbalancer-1 --no-shielded-secure-boot --shielded-vtpm --shielded-integrity-monitoring --reservation-affinity=any --address=${ip} --metadata=startup-script-url=gs://collaborative-teaching.appspot.com/scripts/startup-loadbalancer.bash,startup-status=initializing,created-on=$(date +%s)`;

    exec(command, { silent: true }, (code, stdout, stderr) => {
      if (code !== 0 || stderr) {
        console.error(`Creating Load Balancer failed - ${code}: ${stderr}`);
      }
    });
  }

  createMaster(num: number): void {
    const name = `${INSTANCE_TYPE.MASTER}-${num}`;

    const command = `gcloud beta compute --project=${PROJECT_ID} instances create ${name} --zone=${ZONE} --machine-type=f1-micro --subnet=default --network-tier=PREMIUM --maintenance-policy=MIGRATE --service-account=165250393917-compute@developer.gserviceaccount.com --scopes=https://www.googleapis.com/auth/cloud-platform --tags=http-server --image=ubuntu-minimal-1804-bionic-v20200131 --image-project=ubuntu-os-cloud --boot-disk-size=10GB --boot-disk-type=pd-standard --boot-disk-device-name=loadbalancer-1 --no-shielded-secure-boot --shielded-vtpm --shielded-integrity-monitoring --reservation-affinity=any --metadata=startup-script-url=gs://collaborative-teaching.appspot.com/scripts/startup-master.bash,startup-status=initializing,created-on=$(date +%s)`;

    exec(command, { silent: true }, (code, stdout, stderr) => {
      if (code !== 0 || stderr) {
        console.error(`Creating Master failed - ${code}: ${stderr}`);
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
}

let gcloud: GCloud;

export function makeGCloud() {
  gcloud = new GCloud();
}

export function getGCloud() {
  return gcloud;
}
