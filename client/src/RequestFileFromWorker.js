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
  socket.emit("Retrieve File", {
    docId: "IWQ45PbdKgkIh3JuJ0lO",
    requestId: "James"
  });

  // Listen to worker responses here
  socket.on("Server Response", function(msg) {
    console.log(msg);
  });
});
