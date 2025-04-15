import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, text) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail", // Or use SMTP settings
    auth: {
      user: process.env.EMAIL_USER, // Your email
      pass: process.env.EMAIL_PASS, // Your app password
    },
  });

  await transporter.sendMail({
    from: `"Job Board" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
  });
};
