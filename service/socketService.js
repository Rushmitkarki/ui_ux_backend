const { Server } = require("socket.io");
const Notification = require("../models/notificationModel");

let io;

const users = {};

const initSocket = async (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.id; // Get the userId from the query
    console.log(`User connected: ${userId}`);

    users[userId] = socket.id;

    socket.on("sendMessage", (message) => {
      console.log("Message received:", message);

      // Broadcast the message to all users in the chat
      io.emit("receiveMessage", message);
    });

    // Send notification
    socket.on("sendNotification", async (notificationData) => {
      const newNotification = new Notification({
        sender: notificationData.sender,
        receiver: notificationData.receiver,
        message: notificationData.message,
      });

      await newNotification.save();

      // Emit the notification to the recipient
      const recipientSocketId = users[notificationData.receiver];
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("receiveNotification", newNotification);
      }
    });

    socket.on("test", (data) => {
      console.log("Test event", data);
      socket.broadcast.emit("sendTest", data);
    });

    // Typing event
    socket.on("typing", (data) => {
      console.log(`User ${data.sender} is typing in chat ${data.chatId}`);

      // Broadcast the typing event to all users in the chat except the sender
      socket.broadcast.emit("typingNow", {
        chatId: data.chatId,
        sender: data.sender,
      });
    });
    

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${userId}`);
      delete users[userId]; // Remove user from the map
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};

module.exports = {
  initSocket,
  getIo,
  users,
};
