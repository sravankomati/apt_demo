const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mainRouter = require("./routes");
const { mainSocket } = require("./socket/main");
require("dotenv").config();
require("./config/db");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
// all backend rest apis
app.use("/api", mainRouter);

const server = http.createServer(app);
const io = new Server(server);

io.on("connection", (socket) => {
  console.log(socket.id);
  console.log("a user connected");
  mainSocket(io, socket);
});
server.listen(process.env.Port || 4000, () => {
  console.log(`server is started on this ${process.env.Port} `);
});
