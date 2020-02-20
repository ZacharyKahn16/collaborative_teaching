import { exec } from 'shelljs';

interface ComputeEngineInstance {
  id: string;
  instance: string;
  number: number;
  zone: string;
  machine: string;
  internalIp: string;
  publicIp: string;
  running: boolean;
}

/**
 * Class to interact with GCloud and keep track of its resources
 */
class GCloud {
  private readonly name = process.env.NAME;
  private readonly projectId = process.env.PROJECT_ID;
  private readonly zone = 'us-central1-a';

  instances: ComputeEngineInstance[] = [];

  constructor() {
    this.getInstances();

    setInterval(() => {
      this.getInstances();
    }, 10000);
  }

  getInstances() {
    exec('gcloud compute instances list', { silent: true }, (code, stdout, stderr) => {
      if (code === 0) {
        const output = stdout
          .trim()
          .split('\n')
          .slice(1);

        this.instances = [];

        for (const line of output) {
          const words = line.split(/\s+/);

          const id = words[0].trim();
          const zone = words[1].trim();
          const machine = words[2].trim();
          const internalIp = words[3].trim();
          const publicIp = words[4].trim();
          const running = words[5].trim() === 'RUNNING';

          this.instances.push({
            id,
            instance: id.split('-')[0],
            number: Number(id.split('-')[1]),
            zone,
            machine,
            internalIp,
            publicIp,
            running,
          });
        }
      } else {
        console.error(`Error ${code}: ${stderr}`);
        this.instances = [];
      }
    });
  }
}

const gcloud = new GCloud();

export const GCLOUD = gcloud;
