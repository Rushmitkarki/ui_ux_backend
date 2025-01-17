const express = require("express");
const connectDatabase = require("./database/database");
const http = require("http");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const path = require("path");
const fs = require("fs");
const socketIo = require("socket.io");
const colors = require("colors");
const session = require("express-session");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const { initSocket } = require("./service/socketService");

// Creating an express app
const app = express();

// Express JSON configuration
app.use(express.json());

// setup password

// Create HTTP server
const server = http.createServer(app);

initSocket(server);

// Dotenv configuration
dotenv.config();

// Connecting to the database

// mongoose.connect(process.env.MONGODB_LOCAL).then(() => {
//   console.log("Database Connected".yellow.bold);
// });

app.use(express.urlencoded({ extended: true }));
app.use(
  fileUpload({
    limits: { fileSize: 10 * 1024 * 1024 },
    useTempFiles: true,
    tempFileDir: path.join(__dirname, "tmp"),
  })
);

connectDatabase();

const publicDir = path.join(__dirname, "public");
const insuranceDir = path.join(publicDir, "insurance");

if (!fs.existsSync(insuranceDir)) {
  fs.mkdirSync(insuranceDir, { recursive: true });
}

app.use(express.static("public"));

app.use(
  cors({
    origin: "http://localhost:3000", // Allow only your frontend's origin
    methods: ["GET", "POST", "PUT", "DELETE"], // Allow specific HTTP methods
    credentials: true, // Enable cookies and credentials
  })
);

// Defining the PORT

const PORT = process.env.PORT || 5000;

//express session configuration
app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

// defining routes
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/friend", require("./routes/friendRoutes"));
app.use("/api/post", require("./routes/postRoute"));
app.use("/api/story", require("./routes/storiesRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/message", require("./routes/messageRoutes"));
app.use("/api/game", require("./routes/gameRoute"));
app.use("/api/payment", require("./routes/paymentRoutes"));
app.use("/api/notification", require("./routes/notifiacationRoutes"));

// Starting the server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}...`.blue.bold);
});

module.exports = app;
