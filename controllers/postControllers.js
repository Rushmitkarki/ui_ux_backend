const path = require("path");
const Post = require("../models/postModel");
const User = require("../models/userModel");
const fs = require("fs");

const createPost = async (req, res) => {
  console.log(req.body);
  console.log(req.files);

  const { content } = req.body;
  if (!content) {
    return res.status(400).json({
      success: false,
      message: "Please provide content.",
    });
  }

  if (!content && (!req.files || !req.files.media)) {
    return res.status(400).json({
      success: false,
      message: "Please provide content or upload media.",
    });
  }

  let mediaName = null;
  if (req.files && req.files.media) {
    const media = req.files.media;
    mediaName = `${Date.now()}-${media.name}`;
    const mediaUploadPath = path.join(
      __dirname,
      `../public/posts/${mediaName}`
    );

    try {
      await media.mv(mediaUploadPath);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to upload media.",
        error: error.message,
      });
    }
  }

  try {
    const newPost = new Post({
      user: req.user.id,
      content,
      media: mediaName,
    });

    const post = await newPost.save();

    res.status(201).json({
      success: true,
      message: "Post created successfully.",
      post,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

// like a post
const likePost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;

  try {
    const post = await Post.findById(postId);
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });

    if (post.likes.includes(userId)) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();

    res.status(200).json({
      success: true,
      message: post.likes.includes(userId) ? "Post liked" : "Post unliked",
      likes: post.likes.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// comment on a post
const commentPost = async (req, res) => {
  const { postId } = req.params;
  const { comment } = req.body;
  const userId = req.user.id;

  try {
    const post = await Post.findById(postId);
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });

    post.comments.push({ user: userId, comment });

    await post.save();

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comments: post.comments,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// share a post
const sharePost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;

  try {
    const post = await Post.findById(postId);
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });

    if (!post.shares.includes(userId)) {
      post.shares.push(userId);
      await post.save();
    }

    res.status(200).json({
      success: true,
      message: "Post shared successfully",
      shares: post.shares.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// get all posts
const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "-password")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, posts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
const updatePost = async (req, res) => {
  const { id } = req.params; // Post ID from the URL
  const { content } = req.body; // Updated content

  try {
    // Find the post by ID
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found.",
      });
    }

    // Check ownership (assuming req.user.id contains the logged-in user's ID)
    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this post.",
      });
    }

    // Update content if provided
    if (content) {
      post.content = content;
    }

    // Replace media if a new file is uploaded
    if (req.files && req.files.media) {
      const media = req.files.media;
      const mediaName = `${Date.now()}-${media.name}`;
      const mediaUploadPath = path.join(
        __dirname,
        `../public/posts/${mediaName}`
      );

      try {
        // Delete the old media file if it exists
        if (post.media) {
          const oldMediaPath = path.join(
            __dirname,
            `../public/posts/${post.media}`
          );
          fs.unlinkSync(oldMediaPath);
        }

        // Save the new media file
        await media.mv(mediaUploadPath);
        post.media = mediaName;
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: "Failed to upload media.",
          error: error.message,
        });
      }
    }

    // Save the updated post
    const updatedPost = await post.save();

    res.status(200).json({
      success: true,
      message: "Post updated successfully.",
      post: updatedPost,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};
// get comments
const getComments = async (req, res) => {
  const { id } = req.params;

  try {
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found.",
      });
    }

    res.status(200).json({
      success: true,
      comments: post.comments,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

// delete post
const deletePost = async (req, res) => {
  const { id } = req.params;

  try {
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found.",
      });
    }

    // Check ownership (assuming req.user.id contains the logged-in user's ID)
    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this post.",
      });
    }

    // Delete the media file if it exists
    if (post.media) {
      const mediaPath = path.join(__dirname, `../public/posts/${post.media}`);
      fs.unlinkSync(mediaPath);
    }

    // Delete the post
    await post.deleteOne();

    res.status(200).json({
      success: true,
      message: "Post deleted successfully.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

// get post by user id
const getPostByUserId = async (req, res) => {
  const { id } = req.user;
  console.log("Fetching posts for user ID:", id);

  try {
    // Validate id
    if (!id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Fetch posts where the user is the author
    const posts = await Post.find({ user: id })
      .populate("user", "name email") // Populate user details
      .populate("comments.user", "name") // Populate commenter details
      .sort({ createdAt: -1 }); // Sort by latest posts

    return res.status(200).json({ posts });
  } catch (error) {
    console.error("Error fetching user posts:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// create cover

module.exports = {
  createPost,
  likePost,
  commentPost,
  sharePost,
  getPosts,
  updatePost,
  deletePost,
  getPostByUserId,
  getComments,
};
