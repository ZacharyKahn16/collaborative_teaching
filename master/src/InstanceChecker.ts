import io from 'socket.io-client';
import moment from 'moment';
import { MongoClient } from 'mongodb';
import { ComputeEngineInstance, GCloud, NUM_MASTERS } from './GCloud';
import { LOGGER } from './Logger';

class SocketClient {
  private instance: ComputeEngineInstance;
  private socket: SocketIOClient.Socket;
  public connected: boolean = false;
  public lastResp: number = moment().unix();

  private readonly intervalId: NodeJS.Timeout;
  private SEND_DB_LIST_INTERVAL = 30 * 1000; // 30 secs (ms)
  private MAX_WAIT_TIME = 2 * 60; // 2 min (s)
  private SOCKET_PORT = 4001;

  constructor(instance: ComputeEngineInstance) {
    this.instance = instance;
    this.socket = io(`http://${this.instance.publicIp}:${this.SOCKET_PORT}`);

    this.socket.on('connect', () => {
      this.connected = true;
      this.lastResp = moment().unix();
    });

    this.socket.on('health-response', () => {
      LOGGER.debug(`${this.instance.id} - communication good.`);
      this.connected = true;
      this.lastResp = moment().unix();
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
    });

    this.updateDatabaseList();
    this.intervalId = setInterval(() => {
      this.updateDatabaseList();
    }, this.SEND_DB_LIST_INTERVAL);
  }

  updateDatabaseList() {
    this.socket.emit('database-instances', GCloud.getGCloud().databaseInstances);
  }

  isSocketGood(): boolean {
    return this.connected || this.lastResp >= moment().unix() - this.MAX_WAIT_TIME;
  }

  isSameInstance(instance: ComputeEngineInstance): boolean {
    return (
      instance.id === this.instance.id &&
      instance.publicIp === this.instance.publicIp &&
      instance.internalIp === this.instance.internalIp
    );
  }

  destroy() {
    clearInterval(this.intervalId);
    this.socket.close();
  }
}

class DatabaseClient {
  private instance: ComputeEngineInstance;
  private url: string;
  public lastResp: number = moment().unix();

  private readonly intervalId: NodeJS.Timeout;
  private MAX_WAIT_TIME = 2 * 60; // 2 min (s)
  private CHECK_DB_INTERVAL = 30 * 1000; // 30 secs (ms)
  private DB_PORT = 80;

  constructor(instance: ComputeEngineInstance) {
    this.instance = instance;
    this.url = `mongodb://${this.instance.publicIp}:${this.DB_PORT}`;

    this.queryMongo();
    this.intervalId = setInterval(() => {
      this.queryMongo();
    }, this.CHECK_DB_INTERVAL);
  }

  queryMongo() {
    MongoClient.connect(this.url, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    })
      .then((client) => {
        this.lastResp = moment().unix();
        LOGGER.debug(`${this.instance.id} - communication good.`);
        return client.close();
      })
      .catch((err) => {});
  }

  isDbGood(): boolean {
    return this.lastResp >= moment().unix() - this.MAX_WAIT_TIME;
  }

  isSameInstance(instance: ComputeEngineInstance): boolean {
    return (
      instance.id === this.instance.id &&
      instance.publicIp === this.instance.publicIp &&
      instance.internalIp === this.instance.internalIp
    );
  }

  destroy() {
    clearInterval(this.intervalId);
  }
}

/**
 * Does a more in depth verification of instances
 * Sets up socket connections to workers
 * Sets up queries to databases
 */
export class InstanceChecker {
  static instanceChecker: InstanceChecker;

  gCloud: GCloud;
  workerSockets: Map<string, SocketClient>;
  dbInstances: Map<string, DatabaseClient>;

  private INSTANCE_CHECK_INTERVAL = 30 * 1000; // 30 secs (ms)

  constructor() {
    this.gCloud = GCloud.getGCloud();
    this.workerSockets = new Map();
    this.dbInstances = new Map();

    setInterval(() => {
      this.checkWorkerSockets();
      this.checkDbClients();
    }, this.INSTANCE_CHECK_INTERVAL);
  }

  checkWorkerSockets() {
    if (!this.gCloud.amICoordinator()) {
      return;
    }

    for (const instance of this.gCloud.workerInstances) {
      const instanceGood = this.gCloud.isInstanceHealthGood(instance);
      const socketInstance = this.workerSockets.get(instance.id);

      // If instance is not good but there is a socket connection. Kil it
      if (!instanceGood && socketInstance !== undefined) {
        socketInstance.destroy();
        this.workerSockets.delete(instance.id);
        LOGGER.debug(`${instance.id} - not good, but there is a socket.`);
        continue;
      }

      // If instance is not good or not serving, move on
      if (!instanceGood || instance.instanceServing !== true) {
        LOGGER.debug(`${instance.id} - not good, not serving.`);
        continue;
      }

      // The instance must be good and serving here.
      // If there is no socket connection, make one
      if (socketInstance === undefined) {
        this.workerSockets.set(instance.id, new SocketClient(instance));
        continue;
      }

      // If the socket instance is not the same as this instance
      // Kill the socket and make a new one
      if (!socketInstance.isSameInstance(instance)) {
        socketInstance.destroy();
        this.workerSockets.delete(instance.id);
        this.workerSockets.set(instance.id, new SocketClient(instance));
        LOGGER.debug(`${instance.id} - socket does not match instance, delete it.`);
        continue;
      }

      // If the socket instance isn't receiving data
      // Delete the instance and start over
      if (!socketInstance.isSocketGood()) {
        socketInstance.destroy();
        this.workerSockets.delete(instance.id);
        this.gCloud.deleteInstance(instance.id);
        LOGGER.debug(`${instance.id} - socket is not receiving data, delete it.`);
      }
    }
  }

  checkDbClients() {
    if (!this.gCloud.amICoordinator()) {
      return;
    }

    for (const instance of this.gCloud.databaseInstances) {
      const instanceGood = this.gCloud.isInstanceHealthGood(instance);
      const dbInstance = this.dbInstances.get(instance.id);

      // If instance is not good but there is a db connection. Kil it
      if (!instanceGood && dbInstance !== undefined) {
        dbInstance.destroy();
        this.workerSockets.delete(instance.id);
        LOGGER.debug(`${instance.id} - not good, but there is a database client.`);
        continue;
      }

      // If instance is not good or not serving, move on
      if (!instanceGood || instance.instanceServing !== true) {
        LOGGER.debug(`${instance.id} - not good, not serving.`);
        continue;
      }

      // The instance must be good and serving here.
      // If there is no db connection, make one
      if (dbInstance === undefined) {
        this.dbInstances.set(instance.id, new DatabaseClient(instance));
        continue;
      }

      // If the socket instance is not the same as this instance
      // Kill the socket and make a new one
      if (!dbInstance.isSameInstance(instance)) {
        dbInstance.destroy();
        this.dbInstances.delete(instance.id);
        this.dbInstances.set(instance.id, new DatabaseClient(instance));
        LOGGER.debug(`${instance.id} - database does not match instance, delete it.`);
        continue;
      }

      // If the database instance isn't receiving data
      // Delete the instance and start over
      if (!dbInstance.isDbGood()) {
        dbInstance.destroy();
        this.dbInstances.delete(instance.id);
        this.gCloud.deleteInstance(instance.id);
        LOGGER.debug(`${instance.id} - database is not good, delete it.`);
      }
    }
  }

  static makeInstanceChecker() {
    if (InstanceChecker.instanceChecker === undefined) {
      InstanceChecker.instanceChecker = new InstanceChecker();
    }
  }

  static getInstanceChecker() {
    if (InstanceChecker.instanceChecker === undefined) {
      InstanceChecker.makeInstanceChecker();
    }

    return InstanceChecker.instanceChecker;
  }
}
