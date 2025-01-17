const mongoose = require("mongoose");
const Message = require("../models/messageModel");
const User = require("../models/userModel");
const Chat = require("../models/chatModel");
const path = require("path");
const fs = require("fs");

// Get all Messages
const allMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender")
      .populate("chat")

      .populate({
        path: "chat",
        populate: {
          path: "users",
          model: "User",
        },
      })
      .populate({
        path: "chat",
        populate: {
          path: "groupAdmin",
          model: "User",
        },
      });
    res.status(200).json({ messages: messages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Send a Message
const sendMessage = async (req, res) => {
  const { content, chatId, contentType } = req.body;

  if (!content || !chatId) {
    console.log("Invalid data is passed");
    return res.sendStatus(400);
  }
  const newMessage = {
    sender: req.user.id,
    content: content,
    chat: chatId,
    contentType: contentType,
  };
  try {
    let message = await Message.create(newMessage);
    message = await message.populate("sender");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users",
    });
    message = await User.populate(message, {
      path: "chat.groupAdmin",
    });

    await Chat.findByIdAndUpdate(chatId, { latestMessage: message });

    res.status(200).json({ message });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
const saveFile = async (req, res) => {
  console.log(req.files);
  var type = "file";
  if (!req.files) {
    return res.status(400).json({
      message: "Please upload a file",
      success: false,
    });
  }

  const { file } = req.files;
  // generate file name
  const fileName = `${Date.now()}_${file.name}`;

  try {
    // Validate file type if type=image, set type to image and save image in '../public/messages/images'
    if (file.mimetype.includes("image")) {
      const filePath = path.join(
        __dirname,
        "../public/message_images",
        fileName
      );
      // Ensure the directory exists
      const directoryPath = path.dirname(filePath);
      fs.mkdirSync(directoryPath, { recursive: true });
      file.mv(filePath);
      type = "image";
    } else {
      // move file to uploads directory
      const filePath = path.join(
        __dirname,
        "../public/messages_files",
        fileName
      );
      // Ensure the directory exists
      const directoryPath = path.dirname(filePath);
      fs.mkdirSync(directoryPath, { recursive: true });
      file.mv(filePath);
      type = "file";
    }

    res.status(200).json({
      message: "File uploaded successfully",
      success: true,
      file: fileName,
      type: type,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error",
      error,
      success: false,
    });
  }
};

module.exports = { allMessages, sendMessage, saveFile };
