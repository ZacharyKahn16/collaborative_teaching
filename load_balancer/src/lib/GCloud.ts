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
class GCloud {}

export const gcloud = new GCloud();
