const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { response } = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const sendEmailOtp = require("../service/sendEmailOtp");
const sendOtp = require("../service/sendOtp");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.CLIENT_ID);

// Create a new user
const createUser = async (req, res) => {
  console.log(req.body);
  const { firstName, lastName, email, password, phone } = req.body;

  if (!firstName || !lastName || !email || !password || !phone) {
    return res.status(400).json({
      sucsess: false,
      message: "Please fill all the fields",
    });
  }
  try {
    const existingUser = await userModel.findOne({ email: email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists...",
      });
    }

    const randomsalt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, randomsalt);

    const newUser = new userModel({
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: hashedPassword,
      phone: phone,
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: "User created successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// login users
const loginUser = async (req, res) => {
  console.log(req.body);
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Please enter all the fields...",
    });
  }

  try {
    const user = await userModel.findOne({ email: email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found...",
      });
    }

    const isvalidPassword = await bcrypt.compare(password, user.password);
    if (!isvalidPassword) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials...",
      });
    }

    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET
    );

    res.status(201).json({
      success: true,
      message: "Login successful...",
      token: token,
      userData: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        id: user._id,
        phone: user.phone,
        isAdmin: user.isAdmin,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal server error...",
    });
  }
};

// forgot password

const forgotPassword = async (req, res) => {
  console.log(req.body);

  const { contact } = req.body;

  if (!contact) {
    return res.status(400).json({
      success: false,
      message: "Please enter your phone number or email",
    });
  }

  // Regular expressions for validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[0-9]{10}$/;

  let email, phone;

  if (emailRegex.test(contact)) {
    email = contact;
  } else if (phoneRegex.test(contact)) {
    phone = contact;
  } else {
    return res.status(400).json({
      success: false,
      message: "Invalid phone number or email",
    });
  }

  try {
    let user;
    if (phone) {
      user = await userModel.findOne({ phone: phone });
    } else if (email) {
      user = await userModel.findOne({ email: email });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate OTP
    const randomOTP = Math.floor(100000 + Math.random() * 900000);
    console.log(randomOTP);

    user.resetPasswordOTP = randomOTP;
    user.resetPasswordExpires = Date.now() + 600000; // 10 minutes
    await user.save();

    let isSent;
    if (phone) {
      isSent = await sendOtp(phone, randomOTP); // Send OTP to phone
    } else if (email) {
      isSent = await sendEmailOtp(email, randomOTP); // Send OTP to email
    }

    if (!isSent) {
      return res.status(400).json({
        success: false,
        message: "Error in sending OTP",
      });
    }

    res.status(200).json({
      success: true,
      message: `OTP sent to your ${phone ? "phone number" : "email"}`,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const verifyOtp = async (req, res) => {
  console.log(req.body);

  const { contact, otp } = req.body;

  if (!contact || !otp) {
    return res.status(400).json({
      success: false,
      message: "Please enter all the fields",
    });
  }

  // Regular expressions for validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[0-9]{10}$/;

  let email, phone;

  if (emailRegex.test(contact)) {
    email = contact;
  } else if (phoneRegex.test(contact)) {
    phone = contact;
  } else {
    return res.status(400).json({
      success: false,
      message: "Invalid phone number or email",
    });
  }

  try {
    let user;
    if (phone) {
      user = await userModel.findOne({ phone });
    } else if (email) {
      user = await userModel.findOne({ email });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check OTP validity
    if (
      user.resetPasswordOTP !== parseInt(otp) ||
      user.resetPasswordExpires < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// reset password
const resetPassword = async (req, res) => {
  console.log(req.body);

  const { contact, otp, password } = req.body;

  if (!contact || !otp || !password) {
    return res.status(400).json({
      success: false,
      message: "Please enter all the fields",
    });
  }

  // Regular expressions for validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[0-9]{10}$/;

  let email, phone;

  if (emailRegex.test(contact)) {
    email = contact;
  } else if (phoneRegex.test(contact)) {
    phone = contact;
  } else {
    return res.status(400).json({
      success: false,
      message: "Invalid phone number or email",
    });
  }

  try {
    let user;
    if (phone) {
      user = await userModel.findOne({ phone });
    } else if (email) {
      user = await userModel.findOne({ email });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check OTP validity
    if (
      user.resetPasswordOTP !== parseInt(otp) ||
      user.resetPasswordExpires < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    const randomsalt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, randomsalt);

    // Update the user's password
    user.password = hashedPassword;
    user.resetPasswordOTP = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
// getAllUsers
const getAllUsers = async (req, res) => {
  try {
    const me = req.user.id;

    // Donot show me
    const allUsers = await userModel
      .find({ _id: { $ne: me } })
      .select("firstName lastName email phone profilePicture");
    res.status(200).json({
      success: true,
      message: "All users fetched sucessfully",
      users: allUsers,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error,
    });
  }
};

const getUnrequestedUsers = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await userModel.findById(userId).populate("friends");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // get all users who are not friends with the logged in user
    const unrequestedUsers = await userModel
      .find({
        _id: { $ne: userId },
        email: { $ne: "admin@gmail.com" },
      })
      .select("firstName lastName email  profilePicture");

    res.status(200).json({
      success: true,
      message: "Unrequested users fetched successfully",
      users: unrequestedUsers,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error,
    });
  }
};

// get singleUser
const getSingleUser = async (req, res) => {
  const userId = req.user.id;
  try {
    const user = await userModel.findById(userId).populate("friends");
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "User fetched successfully",
      user: user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error,
    });
  }
};
// update userprofile

// edit user profile

const editUserProfile = async (req, res) => {
  const { firstName, lastName, email, phone, profilePicture } = req.body;
  const userId = req.user.id;

  try {
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update the user profile fields
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.profilePicture = profilePicture || user.profilePicture;

    // Save the updated user profile
    await user.save();

    res.status(200).json({
      success: true,
      message: "User profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({
      success: false,
      message: "Error updating user profile",
      error: error.message,
    });
  }
};

const searchUsers = async (req, res) => {
  const { query } = req.query;
  const id = req.user;

  try {
    const users = await userModel
      .find({
        $or: [
          { firstName: { $regex: query, $options: "i" } },
          { lastName: { $regex: query, $options: "i" } },
        ],
        _id: { $ne: id },
      })
      .select("firstName lastName email profilePicture");

    res.status(200).json({ success: true, users: users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const uploadProfilePicture = async (req, res) => {
  // const id = req.user.id;
  console.log(req.files);
  const { profilePicture } = req.files;

  if (!profilePicture) {
    return res.status(400).json({
      success: false,
      message: "Please upload an image",
    });
  }

  //  Upload the image
  // 1. Generate new image name
  const imageName = `${Date.now()}-${profilePicture.name}`;

  // 2. Make a upload path (/path/upload - directory)
  const imageUploadPath = path.join(
    __dirname,
    `../public/profile_pictures/${imageName}`
  );

  // Ensure the directory exists
  const directoryPath = path.dirname(imageUploadPath);
  fs.mkdirSync(directoryPath, { recursive: true });

  try {
    // 3. Move the image to the upload path
    profilePicture.mv(imageUploadPath);

    //  send image name to the user
    res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      profilePicture: imageName,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};

// Upload cover photo
const uploadCoverPhoto = async (req, res) => {
  const userId = req.user.id;

  if (!req.files || !req.files.coverPhoto) {
    console.error("No cover photo uploaded or invalid form-data.");
    return res.status(400).json({
      success: false,
      message: "No cover photo uploaded.",
    });
  }

  const coverPhoto = req.files.coverPhoto;
  const coverPhotoName = `${Date.now()}-${coverPhoto.name}`;
  const coverPhotoUploadPath = path.join(
    __dirname,
    `../public/coverphoto/${coverPhotoName}`
  );

  try {
    // Save the cover photo
    await coverPhoto.mv(coverPhotoUploadPath);

    // Update user's cover photo in the database
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Delete the old cover photo if it exists
    if (user.coverphoto) {
      const oldCoverPhotoPath = path.join(
        __dirname,
        `../public/coverphoto/${user.coverphoto}`
      );
      if (fs.existsSync(oldCoverPhotoPath)) {
        fs.unlinkSync(oldCoverPhotoPath);
      }
    }

    user.coverphoto = coverPhotoName;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Cover photo uploaded successfully.",
      coverPhoto: user.coverphoto,
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
// fetch cover photo by id

const fetchCoverPhoto = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await userModel.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

// Edit cover photo
const editCoverPhoto = async (req, res) => {
  const userId = req.user.id;

  if (!req.files || !req.files.coverPhoto) {
    return res.status(400).json({
      success: false,
      message: "No cover photo uploaded.",
    });
  }

  const coverPhoto = req.files.coverPhoto;
  const coverPhotoName = `${Date.now()}-${coverPhoto.name}`;
  const coverPhotoUploadPath = path.join(
    __dirname,
    `../public/coverphoto/${coverPhotoName}`
  );

  try {
    // Save the new cover photo
    await coverPhoto.mv(coverPhotoUploadPath);

    // Update user's cover photo in the database
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Delete the old cover photo if it exists
    if (user.coverphoto) {
      const oldCoverPhotoPath = path.join(
        __dirname,
        `../public/coverphoto/${user.coverphoto}`
      );
      if (fs.existsSync(oldCoverPhotoPath)) {
        fs.unlinkSync(oldCoverPhotoPath);
      }
    }

    user.coverphoto = coverPhotoName;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Cover photo updated successfully.",
      coverPhoto: user.coverphoto,
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

// Delete cover photo
const deleteCoverPhoto = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (!user.coverphoto) {
      return res.status(400).json({
        success: false,
        message: "No cover photo to delete.",
      });
    }

    const coverPhotoPath = path.join(
      __dirname,
      `../public/coverphoto/${user.coverphoto}`
    );
    if (fs.existsSync(coverPhotoPath)) {
      fs.unlinkSync(coverPhotoPath);
    }

    user.coverphoto = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Cover photo deleted successfully.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};
// login with google
const googleLogin = async (req, res) => {
  console.log(req.body);

  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid token",
    });
  }
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.CLIENT_ID,
    });
    const payload = ticket.getPayload();
    console.log("Token payload:", payload);

    const { email_verified, email, given_name, family_name, picture } = payload;

    if (!email_verified) {
      return res.status(400).json({
        success: false,
        message: "Email not verified by Google",
      });
    }
    let user = await userModel.findOne({ email });
    if (!user) {
      const response = await axios.get(picture, { responseType: "stream" });
      const imageName = `${given_name}_${family_name}_${Date.now()}.png`;
      const imagePath = path.join(
        __dirname,
        `../public/profile_pictures/${imageName}`
      );
      const writer = fs.createWriteStream(imagePath);

      response.data.pipe(writer);
      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      user = new userModel({
        firstName: given_name,
        lastName: family_name,
        email,
        password: bcrypt.hashSync("defaultPassword", 10),
        image: imageName,
        googleId: payload.sub,
      });
      await user.save();
    }

    const jwtToken = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET
    );

    return res.status(200).json({
      success: true,
      message: "User Logged In Successfully!",
      token: jwtToken,
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        id: user._id,
        phone: user.phone,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error!",
      error,
    });
  }
};

// get all user by google

const getUserByGoogleEmail = async (req, res) => {
  console.log(req.body);

  const { token } = req.body;
  if (!token) {
    return res.status(400).json({
      success: false,
      message: "Please fill all the fields",
    });
  }
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.CLIENT_ID,
    });
    console.log(ticket);

    const { email } = ticket.getPayload();
    const user = await userModel.findOne({ email: email });
    if (user) {
      return res.status(200).json({
        success: true,
        message: "User found",
        data: user,
      });
    }
    res.status(201).json({
      success: true,
      message: "User not found",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error,
    });
  }
};

module.exports = {
  createUser,
  loginUser,
  forgotPassword,
  resetPassword,
  verifyOtp,
  getAllUsers,
  getSingleUser,
  editUserProfile,
  searchUsers,
  uploadProfilePicture,
  getUnrequestedUsers,
  uploadCoverPhoto,
  fetchCoverPhoto,
  editCoverPhoto,
  deleteCoverPhoto,
  googleLogin,
  getUserByGoogleEmail,
};
