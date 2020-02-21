import { exec } from 'shelljs';

const INSTANCE_TYPE = {
  LOAD_BALANCE: 'loadbalancer',
  MASTER: 'master',
  DATABSE: 'database',
};

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
  private readonly name = process.env.NAME;
  private readonly projectId = process.env.PROJECT_ID;
  private readonly zone = 'us-central1-a';

  databaseInstances: ComputeEngineInstance[] = [];
  masterInstances: ComputeEngineInstance[] = [];
  loadBalancerInstances: ComputeEngineInstance[] = [];

  allInstances: ComputeEngineInstance[] = [];

  constructor() {
    this.getInstances();

    setInterval(() => {
      this.filterInstances();
    }, 10 * 1000);

    setInterval(() => {
      this.getInstances();
    }, 60 * 1000);
  }

  getInstances() {
    exec('gcloud compute instances list', { silent: true }, (code, stdout, stderr) => {
      if (code === 0) {
        const output = stdout
          .trim()
          .split('\n')
          .slice(1);

        this.allInstances = [];

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

          this.allInstances.push(instance);

          this.getMetadata(id, this.allInstances.length - 1);
        }
      } else {
        console.error(`Error ${code}: ${stderr}`);
        this.allInstances = [];
      }
    });
  }

  async getMetadata(id: string, index: number) {
    exec(
      `gcloud compute instances describe ${id} --flatten="metadata[]" --zone=${this.zone}`,
      { silent: true },
      (code, stdout, stderr) => {
        let output = stdout
          .trim()
          .split('\n')
          .slice(3);
        output.pop();

        for (let i = 0; i < output.length; i++) {
          const line = output[i];

          if (line.includes('created')) {
            // @ts-ignore
            this.allInstances[index].createdOn = Number(output[i + 1].match(/\d+/)[0].trim());
          } else if (line.includes('startup-on')) {
            // @ts-ignore
            this.allInstances[index].initializedOn = Number(output[i + 1].match(/\d+/)[0].trim());
          } else if (line.includes('startup-status')) {
            this.allInstances[index].instanceServing =
              output[i + 1].split('value: ')[1].replace("'", '') === 'running';
          }
        }
      },
    );
  }

  filterInstances(): void {
    this.loadBalancerInstances = this.allInstances.filter((instance) => {
      return instance.instanceType.includes(INSTANCE_TYPE.LOAD_BALANCE);
    });

    this.masterInstances = this.allInstances.filter((instance) => {
      return instance.instanceType.includes(INSTANCE_TYPE.MASTER);
    });

    this.databaseInstances = this.allInstances.filter((instance) => {
      return instance.instanceType.includes(INSTANCE_TYPE.DATABSE);
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
