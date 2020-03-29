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
  // Exp between 9 and 18 (corresponds to 512 ms to 262144 ms)
  const exp = Math.min(retryNum + 9, 18);
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

export class NetworkInstance {
  workerInfo: WorkerInstance | undefined = undefined;
  socket: SocketIOClient.Socket | undefined = undefined;

  connectionAttempts = 0;
  isLoaded = false;

  allFiles: Record<string, any>[] = [];
  allCourses: Record<string, any>[] = [];
  messages: Record<string, any>[] = [];

  callbacks: any = undefined;

  constructor() {
    this.connectMaster(MASTER_STATIC_IPS[0], MASTER_STATIC_IPS[1]);

    setInterval(() => {
      if (!this.isLoaded && this.workerInfo !== null) {
        if (this.socket) {
          this.socket.close();
        }

        this.socket = undefined;
        this.workerInfo = undefined;
        this.update();
        this.connectMaster(MASTER_STATIC_IPS[0], MASTER_STATIC_IPS[1]);
      }
    }, 10 * 1000);
  }

  setupCallback(callbacks: any) {
    this.callbacks = callbacks;
  }

  update() {
    if (this.callbacks) {
      const {
        setIsLoaded,
        setWorkerInfo,
        setAllFiles,
        setResponses,
        setAllCourses,
      } = this.callbacks;

      setIsLoaded(this.isLoaded);
      setWorkerInfo(this.workerInfo);
      setAllFiles(this.allFiles);
      setResponses(this.messages);
      setAllCourses(this.allCourses);
    }
  }

  connectMaster(ipOne: string, ipTwo: string) {
    console.log("trying to connect to master, attempt", this.connectionAttempts);

    axios
      .get(ipOne)
      .then((result) => {
        if (!result.data.worker) {
          this.isLoaded = false;
          this.connectionAttempts = this.connectionAttempts + 1;

          setTimeout(() => {
            this.connectMaster(ipTwo, ipOne);
          }, backOffForRetry(this.connectionAttempts));
        } else {
          console.log("got worker from master", result.data.worker);
          this.workerInfo = result.data.worker as WorkerInstance;
          this.update();
          this.setupWorker();
        }
      })
      .catch((error) => {
        console.error("master connection error", error);
        this.isLoaded = false;
        this.connectionAttempts = this.connectionAttempts + 1;

        setTimeout(() => {
          this.connectMaster(ipTwo, ipOne);
        }, backOffForRetry(this.connectionAttempts));
      });
  }

  setupWorker() {
    if (!this.workerInfo) {
      return;
    }

    if (this.socket) {
      this.socket.close();
    }

    this.socket = io(`http://${this.workerInfo.publicIp}:${WORKER_SOCKET_PORT}`);

    this.socket.on("connect", () => {
      console.log("connected to worker", this.workerInfo);

      this.isLoaded = true;
      this.connectionAttempts = 0;
      this.update();
    });

    this.socket.on(SERVER_RESP, (resp: Record<string, any>) => {
      console.log("Last Response", resp);
      this.messages = [...this.messages, resp];
      this.update();
    });

    this.socket.on(ALL_FILES, (resp: Record<string, any>[]) => {
      this.allFiles = resp;
      console.log(ALL_FILES, resp);
      this.update();
    });

    this.socket.on(ALL_COURSES, (resp: Record<string, any>[]) => {
      this.allCourses = resp;
      console.log(ALL_COURSES, resp);
      this.update();
    });

    this.socket.on("disconnect", () => {
      console.log("disconnected from worker", this.workerInfo);

      if (this.socket) {
        this.socket.close();
      }

      this.socket = undefined;
      this.workerInfo = undefined;
      this.connectionAttempts = 0;
      this.connectMaster(MASTER_STATIC_IPS[0], MASTER_STATIC_IPS[1]);
      this.update();
    });
  }

  readFileAsDataUrl(file: File) {
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

  getFileFromWorker(docId: string, requestId: string) {
    if (this.socket) {
      this.socket.emit(RETRIEVE_FILE, {
        docId: docId,
        requestId: requestId,
      });
    }
  }

  writeNewFile(file: File, ownerId: string) {
    if (this.socket) {
      this.readFileAsDataUrl(file)
        .then((dataUrl) => {
          const hash = SHA256(dataUrl).toString();
          console.log("sending file with hash: ", hash);

          // @ts-ignore
          this.socket.emit(INSERT_FILE, {
            ownerId: ownerId,
            requestId: v4(),
            fileName: file.name,
            fileContents: dataUrl,
            fileHash: hash,
            fileType: file.type,
          });
        })
        .catch((err) => {
          console.error(err);
        });
    }
  }

  updateExistingFile(file: File, ownerId: string) {
    if (this.socket) {
      this.readFileAsDataUrl(file)
        .then((dataUrl) => {
          const hash = SHA256(dataUrl).toString();
          console.log("updating file with hash: ", hash);

          // @ts-ignore
          this.socket.emit(UPDATE_FILE, {
            ownerId: ownerId,
            requestId: v4(),
            fileName: file.name,
            fileContents: dataUrl,
            fileHash: hash,
            fileType: file.type,
          });
        })
        .catch((err) => {
          console.error(err);
        });
    }
  }

  setUser(user: any) {
    if (this.socket) {
      this.socket.emit(SET_CLIENT, user);
    }
  }

  addNewCourse(ownerId: string, courseName: string, courseDesc: string) {
    if (this.socket) {
      // @ts-ignore
      this.socket.emit(ADD_COURSE, {
        ownerId,
        courseName,
        courseDesc,
        requestId: v4(),
      });
    }
  }

  updateExistingCourse(ownerId: string, courseId: string, courseName: string, courseDesc: string) {
    if (this.socket) {
      // @ts-ignore
      this.socket.emit(UPDATE_COURSE, {
        ownerId,
        courseId,
        courseName,
        courseDesc,
        requestId: v4(),
      });
    }
  }

  addFileToCourse(ownerId: string, courseId: string, fileId: string) {
    if (this.socket) {
      // @ts-ignore
      this.socket.emit(ADD_FILE_TO_COURSE, {
        ownerId,
        courseId,
        fileId,
        requestId: v4(),
      });
    }
  }

  removeFileFromCourse(ownerId: string, courseId: string, fileId: string) {
    if (this.socket) {
      // @ts-ignore
      this.socket.emit(REMOVE_FILE_FROM_COURSE, {
        ownerId,
        courseId,
        fileId,
        requestId: v4(),
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
