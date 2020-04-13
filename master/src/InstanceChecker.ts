import io from 'socket.io-client';
import moment from 'moment';
import { MongoClient } from 'mongodb';
import { ComputeEngineInstance, GCloud } from './GCloud';
import { LOGGER } from './Logger';

/**
 * Class that handles socket connections to a Worker
 */
class SocketClient {
  private instance: ComputeEngineInstance; // the GCP VM instance for the Worker
  private socket: SocketIOClient.Socket; // the socket connection
  public connected: boolean = false; // whether the socket is connected
  public lastResp: number = moment().unix(); // when the last response was received from the Worker

  private readonly intervalId: NodeJS.Timeout;
  private SEND_DB_LIST_INTERVAL = 30 * 1000; // 30 secs (ms)
  private MAX_WAIT_TIME = 2 * 60; // 2 min (s)
  private SOCKET_PORT = 4001; // socket port information

  /**
   * Given a GCP VM instance, setups up a socket connection to it
   * @param {ComputeEngineInstance} instance
   */
  constructor(instance: ComputeEngineInstance) {
    this.instance = instance;
    this.socket = io(`http://${this.instance.publicIp}:${this.SOCKET_PORT}`);

    // Event fired when socket is connected
    this.socket.on('connect', () => {
      this.connected = true;
      this.lastResp = moment().unix();
    });

    // Channel that receives data from the Worker
    this.socket.on('health-response', () => {
      LOGGER.debug(`${this.instance.id} communication good.`);
      this.connected = true;
      this.lastResp = moment().unix();
    });

    // Event fired when socket is disconnected
    this.socket.on('disconnect', () => {
      this.connected = false;
    });

    this.updateDatabaseList();
    this.intervalId = setInterval(() => {
      this.updateDatabaseList();
    }, this.SEND_DB_LIST_INTERVAL);
  }

  /**
   * Sends the FileDatabase list to the Worker via the socket
   */
  updateDatabaseList() {
    this.socket.emit('database-instances', GCloud.getGCloud().databaseInstances);
  }

  /**
   * Verifies whether the socket connection and the Worker is health and active
   * If the last response received from the Worker was more than 2 min ago, it is considered crashed
   * @returns {boolean}
   */
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

  /**
   * Destroy the socket connection and cleanup
   */
  destroy() {
    clearInterval(this.intervalId);
    this.socket.close();
  }
}

/**
 * Class that handles querying a FileDatabase
 */
class DatabaseClient {
  private instance: ComputeEngineInstance; // the GCP VM instance for the FileDatabase
  private url: string; // the MongoDB connection string
  public lastResp: number = moment().unix(); // when the last response was received from the FileDatabase

  private readonly intervalId: NodeJS.Timeout;
  private MAX_WAIT_TIME = 2 * 60; // 2 min (s)
  private CHECK_DB_INTERVAL = 30 * 1000; // 30 secs (ms)
  private DB_PORT = 80; // MongoDb port information

  /**
   * Given a GCP VM instance, setups up a MongoDB connection to it
   * @param {ComputeEngineInstance} instance
   */
  constructor(instance: ComputeEngineInstance) {
    this.instance = instance;
    this.url = `mongodb://${this.instance.publicIp}:${this.DB_PORT}`;

    this.queryMongo();
    this.intervalId = setInterval(() => {
      this.queryMongo();
    }, this.CHECK_DB_INTERVAL);
  }

  /**
   * Perform a simple query on the MongoDB instance
   */
  queryMongo() {
    MongoClient.connect(this.url, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    })
      .then((client) => {
        this.lastResp = moment().unix();
        LOGGER.debug(`${this.instance.id} communication good.`);
        return client.close();
      })
      .catch((err) => {});
  }

  /**
   * Verifies whether the MongoDB connection and the FileDatabase is health and active
   * If the last response received from the Worker was more than 2 min ago, it is considered crashed
   * @returns {boolean}
   */
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

  /**
   * Destroy the MongoDB connection and cleanup
   */
  destroy() {
    clearInterval(this.intervalId);
  }
}

/**
 * Class that tracks all the Workers and FileDatabases
 * Does an in depth verification of of each of these instances
 * Sets up socket connections to workers
 * Sets up queries to databases
 * Follows a Object Oriented singleton design pattern
 */
export class InstanceChecker {
  static instanceChecker: InstanceChecker; // singleton instance

  // a reference to the the GCloud class, that InstanceChecker depends on
  gCloud: GCloud;

  // Map of all the active Worker socket connections
  workerSockets: Map<string, SocketClient>;

  // Map of all the active File Database query connections
  dbInstances: Map<string, DatabaseClient>;

  // How often to check each instance = 30 secs
  private INSTANCE_CHECK_INTERVAL = 30 * 1000;

  constructor() {
    // get the GCloud reference and store it inside this class
    this.gCloud = GCloud.getGCloud();

    // Create an empty map to store the Worker socket connections
    this.workerSockets = new Map();

    // Create an empty map to store the FileDatabase query connections
    this.dbInstances = new Map();

    // Set up timers to check all the Workers and FileDatabases at the specified interval
    setInterval(() => {
      this.checkWorkerSockets();
      this.checkDbClients();
    }, this.INSTANCE_CHECK_INTERVAL);
  }

  // Check all the active Workers
  checkWorkerSockets() {
    // If this Master is not the Coordinator, return
    if (!this.gCloud.amICoordinator()) {
      return;
    }

    // Get all the Workers and verify them
    for (const instance of this.gCloud.workerInstances) {
      const instanceGood = this.gCloud.isInstanceHealthGood(instance, false);
      const socketInstance = this.workerSockets.get(instance.id);

      // If instance is not good but there is a socket connection. Kil it
      if (!instanceGood && socketInstance !== undefined) {
        socketInstance.destroy();
        this.workerSockets.delete(instance.id);
        LOGGER.debug(`${instance.id} not good, but there is a socket.`);
        continue;
      }

      // If instance is not good or not serving, move on
      if (!instanceGood || instance.instanceServing !== true) {
        LOGGER.debug(`${instance.id} not good, not serving, no socket made.`);
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
        LOGGER.debug(`${instance.id} socket does not match instance, delete it.`);
        continue;
      }

      // If the socket instance isn't receiving data
      // Delete the instance and start over
      if (!socketInstance.isSocketGood()) {
        socketInstance.destroy();
        this.workerSockets.delete(instance.id);
        this.gCloud.deleteInstance(instance.id);
        LOGGER.debug(`${instance.id} socket is not receiving data, delete it.`);
      }
    }
  }

  // Check all the active FileDatabases
  checkDbClients() {
    // If this Master is not the Coordinator, return
    if (!this.gCloud.amICoordinator()) {
      return;
    }

    // Get all the FileDatabases and verify them
    for (const instance of this.gCloud.databaseInstances) {
      const instanceGood = this.gCloud.isInstanceHealthGood(instance, false);
      const dbInstance = this.dbInstances.get(instance.id);

      // If instance is not good but there is a db connection. Kil it
      if (!instanceGood && dbInstance !== undefined) {
        dbInstance.destroy();
        this.workerSockets.delete(instance.id);
        LOGGER.debug(`${instance.id} not good, but there is a database client.`);
        continue;
      }

      // If instance is not good or not serving, move on
      if (!instanceGood || instance.instanceServing !== true) {
        LOGGER.debug(`${instance.id} not good, not serving, no client made.`);
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
        LOGGER.debug(`${instance.id} database does not match instance, delete it.`);
        continue;
      }

      // If the database instance isn't receiving data
      // Delete the instance and start over
      if (!dbInstance.isDbGood()) {
        dbInstance.destroy();
        this.dbInstances.delete(instance.id);
        this.gCloud.deleteInstance(instance.id);
        LOGGER.debug(`${instance.id} database is not good, delete it.`);
      }
    }
  }

  /**
   * Instantiates the singleton
   */
  static makeInstanceChecker() {
    if (InstanceChecker.instanceChecker === undefined) {
      InstanceChecker.instanceChecker = new InstanceChecker();
    }
  }
}
