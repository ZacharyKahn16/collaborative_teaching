import { request } from './HttpRequest';

interface AppEngineInstance {
  id: string;
  url: string;
}

interface ComputeEngineInstance {
  id: string;
  internalIp: string;
  publicIp: string;
}

/**
 * Class to interact with GCloud and keep track of its resources
 */
class GCloud {
  private readonly PROJECT_ID = 'collaborative-teaching';
  private readonly ZONE = 'us-central1-a';
  private readonly GET_APP_ENGINE = `https://appengine.googleapis.com/v1/apps/${this.PROJECT_ID}/services`;
  private readonly GET_COMPUTE_ENGINE = `https://content-compute.googleapis.com/compute/v1/projects/${this.PROJECT_ID}/zones/${this.ZONE}/instances`;

  appEngineInstances: AppEngineInstance[];
  computeEngineInstances: ComputeEngineInstance[];

  constructor() {
    this.appEngineInstances = [];
    this.computeEngineInstances = [];
  }

  getAppEngineInstances(): void {
    request('GET', this.GET_APP_ENGINE).then((data) => {
      const services = data.services;
      this.appEngineInstances = services.map(
        (service: Record<string, any>): AppEngineInstance => {
          const id = service.id;
          const url =
            id === 'default'
              ? `https://${this.PROJECT_ID}.appspot.com/`
              : `https://${id}-dot-${this.PROJECT_ID}.appspot.com/`;

          return {
            id,
            url,
          };
        },
      );
    });
  }

  getComputeEngineInstances(): void {
    request('GET', this.GET_COMPUTE_ENGINE).then((data) => {
      const vms = data.items;
      this.appEngineInstances = vms.map(
        (vm: Record<string, any>): ComputeEngineInstance => {
          return {
            id: vm.name,
            internalIp: vm.networkInterfaces[0].networkIP,
            publicIp: vm.networkInterfaces[0].accessConfigs[0].natIP,
          };
        },
      );
    });
  }
}

const gcloud = new GCloud();

export function getGCloudInstance() {
  return gcloud;
}
