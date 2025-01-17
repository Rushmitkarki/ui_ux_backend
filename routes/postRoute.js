const router = require("express").Router();
const postController = require("../controllers/postControllers");
const { authGuard } = require("../middleware/authGuard");

// Create a new post
router.post("/create_post", authGuard, postController.createPost);

// get all post
router.get("/get_all_posts", authGuard, postController.getPosts);

// like a post
router.put("/like_post/:postId", authGuard, postController.likePost);

// comment on a post
router.put("/comment_post/:postId", authGuard, postController.commentPost);

// share a post
router.put("/share_post/:postId", authGuard, postController.sharePost);

//  update post
router.put("/update_post/:id", authGuard, postController.updatePost);

// delete post
router.delete("/delete_post/:id", authGuard, postController.deletePost);

// fetch the post according to the suer id
router.get("/user_posts", authGuard, postController.getPostByUserId);
// get comments
router.get("/get_comments", authGuard, postController.getComments);

module.exports = router;
