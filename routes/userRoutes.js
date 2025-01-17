const router = require("express").Router();
const userController = require("../controllers/userControllers");
const { authGuard } = require("../middleware/authGuard");

//  Create a new user
router.post("/create", userController.createUser);

// login users
router.post("/login", userController.loginUser);

// forgot password
router.post("/forgot_password", userController.forgotPassword);

// reset password
router.post("/reset_password", userController.resetPassword);

// verify otp
router.post("/verify_otp", userController.verifyOtp);

//  single user
router.get("/get_single_user", authGuard, userController.getSingleUser);

// get all user
router.get("/get_all_users", authGuard, userController.getAllUsers);

// search user
router.get("/search_users", userController.searchUsers);

// update profile picture
router.post("/profile_picture", authGuard, userController.uploadProfilePicture);

// update user
router.put("/update", authGuard, userController.editUserProfile);

// get unrequested users
router.get(
  "/get_unrequested_users",
  authGuard,
  userController.getUnrequestedUsers
);

// login with google
router.post("/google", userController.googleLogin);
router.post("/getGoogleUser", userController.getUserByGoogleEmail);

router.post("/upload_cover", authGuard, userController.uploadCoverPhoto);
router.put("/edit_cover", authGuard, userController.editCoverPhoto);
router.delete("/delete_cover", authGuard, userController.deleteCoverPhoto);
router.get("/fetch", authGuard, userController.fetchCoverPhoto);

module.exports = router;
