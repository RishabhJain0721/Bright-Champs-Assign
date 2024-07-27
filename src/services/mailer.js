import nodemailer from "nodemailer";
import "dotenv/config";

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_PASSWORD,
  },
});

export const sendVerificationMail = async (verificationToken, email) => {
  const baseUrl = process.env.BASE_URL;
  const verificationLink = `${baseUrl}/api/auth/verify-email?token=${verificationToken}`;
  let status = false;

  // Email body with HTML and CSS styling
  let mailOptions = {
    from: "rishujain0721@gmail.com",
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

  // Send the email
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.error(error);
    } else {
      console.log("Email sent: " + info.response);
      status = true;
    }
  });

  return status;
};
