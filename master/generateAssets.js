const cp = require('shelljs').cp;
const sync = require('write').sync;

cp('package.json', 'build/');
cp('package-lock.json', 'build/');
cp('-R', 'node_modules/', 'build/');

const runtime = 'runtime: nodejs12\n';
const instance = 'instance_class: B1\n';
const service = `service: ${process.env.SERVICE_NAME}\n`;
const scaling = 'basic_scaling:\n  max_instances: 1\n  idle_timeout: 10m\n';
const network = 'network:\n  session_affinity: true\n';

sync('build/app.yaml', `${runtime}${instance}${service}${scaling}${network}\n`, {
  newline: true,
  increment: false,
  overwrite: true,
});
