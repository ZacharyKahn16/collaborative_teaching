const cp = require('shelljs').cp;
const sync = require('write').sync;

cp('package.json', 'build/');
cp('package-lock.json', 'build/');
cp('-R', 'node_modules/', 'build/');


const runtime = 'runtime: nodejs12\n';
const instance = 'instance_class: F2\n';
const service = `service: ${process.env.SERVICE_NAME || 'default'}`;

sync(
  'build/app.yaml',
  `${runtime}${instance}${service}\n`,
  {
    newline: true,
    increment: false,
    overwrite: true,
  },
);
