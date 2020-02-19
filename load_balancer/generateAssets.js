const cp = require('shelljs').cp;
const sync = require('write').sync;

cp('package.json', 'build/');
cp('package-lock.json', 'build/');
cp('-R', 'node_modules/', 'build/');

const runtime = 'runtime: nodejs12\n';
const instance = 'instance_class: B1\n';
const service = `service: ${process.env.SERVICE_NAME || 'default'}`;
const scaling = 'basic_scaling:\n';
const max_instance = '  max_instances: 1\n';
const timeout = '  idle_timeout: 10m\n';

sync('build/app.yaml', `${runtime}${instance}${service}${scaling}${max_instance}${timeout}\n`, {
  newline: true,
  increment: false,
  overwrite: true,
});
