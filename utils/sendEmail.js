import nodemailer from "nodemailer";

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    console.log(`Attempting to send email to ${to} with subject: ${subject}`);
    
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      const err = new Error('Missing EMAIL_HOST, EMAIL_USER, or EMAIL_PASS in .env');
      console.error('❌ Email config missing:', err.message);
      throw err;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Verify transporter connection
    await new Promise((resolve, reject) => {
      transporter.verify((error, success) => {
        if (error) {
          console.error('❌ SMTP verification failed:', error.message);
          reject(error);
        } else {
          console.log('✅ SMTP transporter verified');
          resolve(success);
        }
      });
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"LiveTogether" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${to}`);
  } catch (error) {
    console.error('❌ Email sending failed:', {
      message: error.message,
      stack: error.stack,
      to,
      subject
    });
    throw new Error(`Email failed: ${error.message}`);
  }
};

export default sendEmail;

