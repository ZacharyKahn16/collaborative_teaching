import io from 'socket.io-client';
import moment from 'moment';
import { ComputeEngineInstance, GCloud } from './GCloud';

class SocketClient {
  private instance: ComputeEngineInstance;
  private socket: SocketIOClient.Socket;
  public connectedOnce: boolean = false;
  public connected: boolean = false;
  public lastResp: number = moment().unix();

  private readonly intervalId: NodeJS.Timeout;
  private SEND_DB_LIST_INTERVAL = 60 * 1000; // 60 secs (ms)
  private MAX_WAIT_TIME = 2.5 * 60; // 2 min (s)

  constructor(instance: ComputeEngineInstance) {
    this.instance = instance;
    this.socket = io(`http://${this.instance.publicIp}:3000`);

    this.socket.on('connect', () => {
      this.connectedOnce = true;
      this.connected = true;
      this.lastResp = moment().unix();
    });

    this.socket.on('health-response', () => {
      this.connectedOnce = true;
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
    if (this.connectedOnce) {
      this.socket.emit('database-instances', GCloud.getGCloud().databaseInstances);
    }
  }

  isSocketGood(): boolean {
    const now = moment().unix();

    return this.lastResp >= now - this.MAX_WAIT_TIME;
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
    this.connected = false;
    this.socket.close();
  }
}

export class InstanceChecker {
  static instanceChecker: InstanceChecker;

  gCloud: GCloud;

  constructor() {
    this.gCloud = GCloud.getGCloud();
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
