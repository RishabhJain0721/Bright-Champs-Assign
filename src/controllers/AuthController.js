import User from "../models/User.js";
import { isEmailValid } from "../utils/checkEmail.js";
import { hashPassword } from "../utils/hashPassword.js";
import { sendVerificationMail } from "../services/mailer.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export const signup = async (req, res) => {
  console.log("Req body : ", req.body);
  const { username, email, password } = req.body;

  // Check if the email is valid
  if (!isEmailValid(email)) {
    return res.status(400).send({
      status: 400,
      message: "Email domain does not exist or cannot receive emails.",
    });
  }

  // Check if a user with the same email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    console.log("User already exists");
    return res.status(400).send({
      message: "User already exists. Please login.",
      errorName: "User already exists",
    });
  }

  // Hash the password
  const hashedPassword = hashPassword(password);
  console.log("Hashed Password : ", hashedPassword);

  // Generate a verification token
  const verificationToken = jwt.sign({ email }, process.env.SECRET_KEY, {
    expiresIn: "1d", // Token expires in 1 day
  });
  console.log("Verification Link : ", verificationToken);

  try {
    // Create a new user with the verification token
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      isVerified: false,
      verificationToken,
    });

    await newUser.save();

    const status = sendVerificationMail(verificationToken, email);
    if (!status) {
      throw new Error("Email verification failed");
    }
    res.status(200).send({
      status: 200,
      message: "Signup successful. Please check your email for verification.",
    });
  } catch (err) {
    res.status(400).send({ message: "Signup failed. Please try again later." });
  }
};

export const verifyEmail = async (req, res) => {
  const { token } = req.query;
  console.log("Token : ", token);
  try {
    // Verify the token and find the user
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const user = await User.findOne({ email: decoded.email });
    if (user) {
      user.isVerified = true;
      await user.save();
      res.status(200).send({
        status: 200,
        message: "Email verification successful.",
      });
    } else {
      res.status(400).send({
        status: 400,
        message: "Invalid token. Email verification failed.",
      });
    }
  } catch (error) {
    res.status(500).send({
      status: 500,
      message: "Email verification failed.",
    });
  }
};

export const login = async (req, res) => {
  console.log("Req body : ", req.body);
  const { username, password } = req.body;

  const existingUser = await User.findOne({ username }).lean();

  if (!existingUser) {
    // No such user found
    console.log("User does not exist");
    return res.status(400).send({
      status: 400,
      message: "User does not exist. Please signup.",
    });
  }

  if (!existingUser.isVerified) {
    // Unverified user
    console.log("User is not verified");
    return res.status(400).send({
      status: 400,
      message: "User is not verified. Please verify.",
    });
  }

  const checkPassword = bcrypt.compareSync(password, existingUser.password);

  if (!checkPassword) {
    // Incorrect password
    console.log("Password is incorrect");
    return res.status(400).send({
      status: 400,
      message: "Password is incorrect. Please try again.",
    });
  }

  // Login successful
  console.log("Login successful");

  res.status(200).send({
    status: 200,
    message: "Login successful.",
  });
};

export const resetPassword = async (req, res) => {
  // Code for resetting a user's password
};
