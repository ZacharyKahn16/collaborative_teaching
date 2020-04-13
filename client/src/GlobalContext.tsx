import React, { createContext, useEffect, useState, Dispatch, SetStateAction } from "react";
import { v4 } from "uuid";
import axios from "axios";
import io from "socket.io-client";
import { SHA256 } from "crypto-js";
import { MASTER_STATIC_IPS, WORKER_SOCKET_PORT } from "./ServerConfig";
import { AUTH } from "./Firebase";

// incoming
const SERVER_RESP = "Server Response";
const ALL_FILES = "All Files";
const ALL_COURSES = "All Courses";

// outgoing
const RETRIEVE_FILE = "Retrieve File";
const INSERT_FILE = "Insert File";
const UPDATE_FILE = "Update File";
const DELETE_FILE = "Delete File";
const SET_CLIENT = "Set Client";
const ADD_COURSE = "Add Course";
const UPDATE_COURSE = "Update Course";
const ADD_FILE_TO_COURSE = "Add File To Course";
const REMOVE_FILE_FROM_COURSE = "Remove File From Course";

function backOffForRetry(retryNum: number) {
  const exp = Math.min(retryNum, 10);
  const nominalDelay = 2 ** exp;
  return nominalDelay * (Math.random() + 0.5);
}

interface WorkerInstance {
  id: string;
  instanceType: string;
  number: number;
  zone: string;
  machine: string;
  internalIp: string;
  publicIp: string;
  instanceRunning: boolean;

  createdOn?: number;
  initializedOn?: number;
  instanceServing?: boolean;
}

interface Doc extends File {
  docId: string;
}

export class NetworkInstance {
  workerInfo: WorkerInstance | undefined = undefined;
  socket: SocketIOClient.Socket | undefined = undefined;

  connectionAttempts = 0;

  allFiles: Record<string, any>[] = [];
  allCourses: Record<string, any>[] = [];
  messages: Record<string, any>[] = [];

  callbacks: any = undefined;
  connectedToSocket = false;

  constructor() {
    this.connectMaster(MASTER_STATIC_IPS[0], MASTER_STATIC_IPS[1], MASTER_STATIC_IPS[2]);

    setInterval(() => {
      if (this.workerInfo && !this.connectedToSocket) {
        this.setupWorker();
      }
    }, 2 * 1000);

    setInterval(() => {
      this.update();
    }, 2000);
  }

  setupCallback(callbacks: any) {
    this.callbacks = callbacks;
  }

  //Update global variables with newly fetched data and messages
  update() {
    if (this.callbacks) {
      const {
        setIsLoaded,
        setWorkerInfo,
        setAllFiles,
        setResponses,
        setAllCourses,
      } = this.callbacks;

      setIsLoaded(
        this.workerInfo !== undefined && this.socket !== undefined && this.connectedToSocket,
      );
      setWorkerInfo(this.workerInfo);
      setAllFiles(this.allFiles);
      setResponses(this.messages);
      setAllCourses(this.allCourses);
    }
  }

  resetSocket() {
    if (this.socket) {
      this.socket.close();
    }

    this.socket = undefined;
    this.workerInfo = undefined;
    this.connectedToSocket = false;
    this.connectionAttempts = 0;
    this.connectMaster(MASTER_STATIC_IPS[0], MASTER_STATIC_IPS[1], MASTER_STATIC_IPS[2]);
    this.update();
  }

  connectMaster(ipOne: string, ipTwo: string, ipThree: string) {
    this.connectionAttempts = this.connectionAttempts + 1;

    //Make a HTTP request to connect to one of the three masters with a 2 second timeout for each
    axios
      .get(ipOne, { timeout: 2 * 1000 })
      .then((result) => {
        console.log("response from master", ipOne, result.data.worker);
        if (result.data && result.data.worker && result.data.worker.publicIp) {
          this.workerInfo = result.data.worker as WorkerInstance;
          this.update();
          this.connectionAttempts = 0;
        } else {
          setTimeout(() => {
            //On timeout, cycle to the next ip round robin fashion
            this.connectMaster(ipTwo, ipThree, ipOne);
          }, backOffForRetry(this.connectionAttempts));
        }
      })
      .catch((error) => {
        //On an error, cycle to the next ip round robin fashion
        setTimeout(() => {
          this.connectMaster(ipTwo, ipThree, ipOne);
        }, backOffForRetry(this.connectionAttempts));
      });
  }

  //connects to the fetched worker
  setupWorker() {
    //If no worker fetched yet, return
    if (!this.workerInfo || !this.workerInfo.publicIp) {
      return;
    }

    //Close socket if already open
    if (this.socket) {
      this.socket.close();
    }

    //Connect to worker instance through the fetched ip
    this.socket = io(`http://${this.workerInfo.publicIp}:${WORKER_SOCKET_PORT}`);

    this.socket.on("connect", () => {
      // @ts-ignore
      console.log("connected to", this.workerInfo.id);

      this.connectedToSocket = true;
      this.connectionAttempts = 0;
      this.update();
    });

    //Place latest responses in message array
    this.socket.on(SERVER_RESP, (resp: Record<string, any>) => {
      console.log("Last Response", resp);
      this.messages = [...this.messages, resp];
      this.update();
    });

    //Fetch all files
    this.socket.on(ALL_FILES, (resp: Record<string, any>[]) => {
      this.allFiles = resp;
      console.log(ALL_FILES, resp);
      this.update();
    });

    //Fetch all courses
    this.socket.on(ALL_COURSES, (resp: Record<string, any>[]) => {
      this.allCourses = resp;
      console.log(ALL_COURSES, resp);
      this.update();
    });

    //Error event handling
    this.socket.on("connect_error", () => {
      console.log("connect_error socket", this.workerInfo);
      this.resetSocket();
    });

    this.socket.on("connect_timeout", () => {
      console.log("connect_timeout socket", this.workerInfo);
      this.resetSocket();
    });

    this.socket.on("reconnect_failed", () => {
      console.log("reconnect_failed socket", this.workerInfo);
      this.resetSocket();
    });

    this.socket.on("reconnect_error", () => {
      console.log("reconnect_error socket", this.workerInfo);
      this.resetSocket();
    });

    this.socket.on("disconnect", () => {
      console.log("disconnected socket", this.workerInfo);
      this.resetSocket();
    });

    this.socket.on("error", () => {
      console.log("error socket", this.workerInfo);
      this.resetSocket();
    });
  }

  //Reads a file and turns it to data url for viewing
  readFileAsDataUrl(file: Doc | File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        if (event.target) {
          // @ts-ignore
          resolve(event.target.result as string);
        } else {
          reject(new Error("Event target is null"));
        }
      };

      reader.onerror = (err) => {
        reject(err);
      };

      reader.readAsDataURL(file);
    });
  }

  getFileFromWorker(docId: string, requestId: string = v4()) {
    if (this.socket) {
      this.socket.emit(RETRIEVE_FILE, {
        docId: docId,
        requestId: requestId,
      });
    }
  }

  writeNewFile(file: File, ownerId: string, requestId: string = v4()) {
    this.readFileAsDataUrl(file)
      .then((dataUrl) => {
        const hash = SHA256(dataUrl).toString();

        if (this.socket) {
          this.socket.emit(INSERT_FILE, {
            ownerId,
            requestId,
            fileName: file.name,
            fileContents: dataUrl,
            fileHash: hash,
            fileType: file.type,
          });
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }

  updateExistingFile(file: Doc, ownerId: string, requestId: string = v4()) {
    this.readFileAsDataUrl(file)
      .then((dataUrl) => {
        const hash = SHA256(dataUrl).toString();

        if (this.socket) {
          this.socket.emit(UPDATE_FILE, {
            docId: file.docId,
            ownerId: ownerId,
            requestId,
            fileName: file.name,
            fileContents: dataUrl,
            fileHash: hash,
            fileType: file.type,
          });
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }

  deleteExistingFile(docId: string, ownerId: string, requestId: string = v4()) {
    if (this.socket) {
      this.socket.emit(DELETE_FILE, {
        docId,
        ownerId,
        requestId,
      });
    }
  }

  setUser(user: any) {
    if (this.socket) {
      this.socket.emit(SET_CLIENT, user);
    }
  }

  addNewCourse(ownerId: string, courseName: string, courseDesc: string, requestId: string = v4()) {
    if (this.socket) {
      this.socket.emit(ADD_COURSE, {
        ownerId,
        courseName,
        courseDesc,
        requestId,
      });
    }
  }

  updateExistingCourse(
    ownerId: string,
    courseId: string,
    courseName: string,
    courseDesc: string,
    requestId: string = v4(),
  ) {
    if (this.socket) {
      this.socket.emit(UPDATE_COURSE, {
        ownerId,
        courseId,
        courseName,
        courseDesc,
        requestId,
      });
    }
  }

  addFileToCourse(ownerId: string, courseId: string, fileId: string, requestId: string = v4()) {
    if (this.socket) {
      this.socket.emit(ADD_FILE_TO_COURSE, {
        ownerId,
        courseId,
        fileId,
        requestId,
      });
    }
  }

  removeFileFromCourse(
    ownerId: string,
    courseId: string,
    fileId: string,
    requestId: string = v4(),
  ) {
    if (this.socket) {
      this.socket.emit(REMOVE_FILE_FROM_COURSE, {
        ownerId,
        courseId,
        fileId,
        requestId,
      });
    }
  }
}

const NETWORK_INSTANCE = new NetworkInstance();

export const GlobalContext = createContext<{
  network: NetworkInstance;
  isLoaded: boolean;
  user: firebase.User | null;
  workerInfo: WorkerInstance | null;
  allFiles: Record<string, any>[];
  allCourses: Record<string, any>[];
  responses: Record<string, any>[];
  selectedFileId: string;
  setSelectedFileId: Dispatch<SetStateAction<string>>;
}>({
  network: NETWORK_INSTANCE,
  isLoaded: false,
  user: null,
  workerInfo: null,
  allFiles: [],
  allCourses: [],
  responses: [],
  selectedFileId: "",
  setSelectedFileId: () => {},
});

const GlobalContextProvider = (props: any) => {
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [workerInfo, setWorkerInfo] = useState<WorkerInstance | null>(null);
  const [allFiles, setAllFiles] = useState<Record<string, any>[]>([]);
  const [allCourses, setAllCourses] = useState<Record<string, any>[]>([]);
  const [responses, setResponses] = useState<Record<string, any>[]>([]);
  const [selectedFileId, setSelectedFileId] = useState("");

  useEffect(() => {
    AUTH.onAuthStateChanged((newUser) => {
      if (newUser) {
        setUser({
          uid: newUser.uid,
          name: newUser.displayName,
          email: newUser.email,
        });
      } else {
        setUser(null);
      }
    });
  }, []);

  useEffect(() => {
    NETWORK_INSTANCE.setupCallback({
      setIsLoaded,
      setWorkerInfo,
      setAllFiles,
      setResponses,
      setAllCourses,
    });
  }, []);

  useEffect(() => {
    if (isLoaded && user) {
      NETWORK_INSTANCE.setUser(user);
    }
  }, [isLoaded, user]);

  return (
    <GlobalContext.Provider
      value={{
        network: NETWORK_INSTANCE,
        isLoaded,
        user,
        workerInfo,
        allFiles,
        allCourses,
        responses,
        selectedFileId,
        setSelectedFileId,
      }}
    >
      {props.children}
    </GlobalContext.Provider>
  );
};

export default GlobalContextProvider;
