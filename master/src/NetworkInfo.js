import { exec } from 'child_process';

export function listComputeInstances() {
  exec('gcloud compute instances list', (error, stdout, stderr) => {
    if (error) {
      console.error(error.message);
      return;
    }

    if (stderr) {
      console.error(stderr);
      return;
    }

    console.debug(`Compute: ${stdout}`);
  });
}

export function listAppInstances() {
  exec('gcloud app instances list', (error, stdout, stderr) => {
    if (error) {
      console.error(error.message);
      return;
    }

    if (stderr) {
      console.error(stderr);
      return;
    }

    console.debug(`App: ${stdout}`);
  });
}
