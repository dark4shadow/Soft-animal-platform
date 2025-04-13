const nodemailer = require('nodemailer');

// Для цього вам потрібно буде встановити nodemailer:
// npm install nodemailer

const sendEmail = async (options) => {
  // Створити транспортер (налаштування залежать від вашого провайдера email)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD
    }
  });

  // Налаштування для листа
  const mailOptions = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    html: options.html
  };

  // Відправка email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;