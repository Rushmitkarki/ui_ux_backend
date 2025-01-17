const Story = require("../models/storiesModel");
const path = require("path");
const fs = require("fs");

// Add a new story
const addStory = async (req, res) => {
  const { title, content } = req.body;
  const id = req.user;
  const { storyImage } = req.files || {};

  if (!title || !content) {
    return res.status(400).json({
      success: false,
      message: "Please provide title and content",
    });
  }

  try {
    let imagePath = null;

    if (storyImage) {
      const imageName = `${Date.now()}-${storyImage.name}`;
      const uploadPath = path.join(
        __dirname,
        `../public/story_images/${imageName}`
      );

      fs.mkdirSync(path.dirname(uploadPath), { recursive: true });
      storyImage.mv(uploadPath);

      imagePath = imageName;
    }

    const story = new Story({
      user: req.user.id,
      title,
      content,
      image: imagePath,
    });

    await story.save();

    res.status(201).json({
      success: true,
      message: "Story added successfully",
      story,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Edit a story
const editStory = async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  const userId = req.user.id;

  try {
    const story = await Story.findOne({ _id: id, createdBy: userId });

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found or not authorized",
      });
    }

    story.title = title || story.title;
    story.content = content || story.content;

    await story.save();

    res.status(200).json({
      success: true,
      message: "Story updated successfully",
      story,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete a story
const deleteStory = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const story = await Story.findOneAndDelete({
      _id: id,
      createdBy: userId,
    });

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found or not authorized",
      });
    }

    res.status(200).json({
      success: true,
      message: "Story deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Fetch all stories
const getAllStories = async (req, res) => {
  try {
    const stories = await Story.find()
      .populate("user", "firstName lastName email profilePicture")
      .sort({ createdAt: -1 });

    res.status(200).json({  
      success: true,
      stories,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  addStory,
  editStory,
  deleteStory,
  getAllStories,
};
