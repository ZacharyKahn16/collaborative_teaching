const request = require("request");
const io = require("socket.io-client");

// This request will ask the MR for a worker IP
request("http://35.224.26.195:4000/worker", { json: true }, function(
  err,
  res,
  body
) {
  if (err) {
    console.log(err);
    return err;
  }
  const ipAddress = body["worker"]["publicIp"];
  const socket = io(`http://${ipAddress}:4001`);
  socket.on("connect", () => {
    console.log("connected");
  });

  // Send worker a request to write a file into the FDB
  socket.emit("Insert File", {
    fileName: "Test-File.txt",
    fileContents: "Hello World 1",
    fileType: "String",
    fileHash: "XXXXXXXX",
    requestId: "XCJ321CSAD",
    ownerId: "192.168.12.0"
  });

  // Listen to worker responses here
  socket.on("Server Response", function(msg) {
    console.log(msg);
  });
});
