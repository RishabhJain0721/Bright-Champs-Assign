import User from "../models/User.js";
import { isEmailValid } from "../utils/checkEmail.js";
import { hashPassword } from "../utils/hashPassword.js";
import { sendVerificationMail } from "../services/mailer.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";

export const signup = async (req, res) => {
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

  // Generate a verification token
  const verificationToken = jwt.sign({ email }, process.env.SECRET_KEY, {
    expiresIn: "1d", // Token expires in 1 day
  });

  try {
    const baseUrl = process.env.BASE_URL;
    const verificationLink = `${baseUrl}/api/auth/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: process.env.ADMIN_EMAIL,
      to: email,
      subject: "Verify your email",
      html: `
          <div style="font-family: Arial, sans-serif;">
            <p style="color: #666;">This is an assignment by Bright Champs, please verify your email address by clicking the link below:</p>
            <p><a href="${verificationLink}" target="_blank" style="display: inline-block; background-color: #007bff; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 5px;">Verify Email Address</a></p>
            <p style="color: #666;">If you did not sign up for an account, you can safely ignore this email.</p>
            <p style="color: #666;">Thank you!</p>
          </div>
        `,
    };

    const status = await sendVerificationMail(email, mailOptions);
    if (!status) {
      throw new Error("Email verification failed");
    }
    // Create a new user with the verification token
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      isVerified: false,
      verificationToken,
    });

    await newUser.save();
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
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });

    const baseUrl = process.env.BASE_URL;
    const resetButtonLink = `${baseUrl}/api/auth/reset-page?token=${user.verificationToken}`;

    console.log("Reset Button Link : ", resetButtonLink);

    const mailOptions = {
      from: process.env.ADMIN_EMAIL,
      to: email,
      subject: "Reset your password",
      html: `
          <div style="font-family: Arial, sans-serif;">
            <p style="color: #666;">Please reset your password by clicking the link below:</p>
            <p><a href="${resetButtonLink}" target="_blank" style="display: inline-block; background-color: #D32F2F; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 5px;">Reset Password</a></p>
            <p style="color: #666;">Thank you!</p>
          </div>
        `,
    };

    await sendVerificationMail(email, mailOptions);

    res.status(200).send({
      status: 200,
      message: "Password reset link sent to your email.",
    });
  } catch (error) {
    res.status(400).send({
      status: 400,
      message: "Password reset failed. Please try again later.",
    });
  }
};

export const resetPage = async (req, res) => {
  const { token } = req.query;

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const user = await User.findOne({ email: decoded.email });
    if (user) {
      res.sendFile(path.join(__dirname, "..", "public", "resetPass.html"));
    } else {
      res.status(400).send({
        status: 400,
        message: "Invalid token. Password reset failed.",
      });
    }
  } catch (error) {
    res.status(500).send({
      status: 500,
      message: "Password reset failed.",
    });
  }
};

export const reset = async (req, res) => {
  const { token, password } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const user = await User.findOne({ email: decoded.email });

    if (user) {
      user.password = hashPassword(password);
      await user.save();
      res.status(200).send({
        status: 200,
        message: "Password reset successful.",
      });
    }
  } catch (error) {
    res.status(500).send({
      status: 500,
      message: "Password reset failed.",
    });
  }
};
