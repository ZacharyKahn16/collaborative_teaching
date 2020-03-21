const request = require("request");
const io = require("socket.io-client");

// const ipAddress = body["worker"]["publicIp"];
const ipAddress = "localhost";
const socket = io(`http://${ipAddress}:4001`);
socket.on("connect", () => {
  console.log("connected");
});

// Send worker a request to write a file into the FDB
socket.emit("Retrieve File", {
  docId: "H6NRWUcKCFrdwRajRWKR",
  requestId: "James"
});

// Listen to worker responses here
socket.on("Server Response", function(msg) {
  console.log(msg);
});
