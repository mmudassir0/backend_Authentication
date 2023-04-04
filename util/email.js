const nodemailer = require("nodemailer");

const sendEmail = async (option) => {
  // 1:create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    // for gmail activate the less secure option OR  we use mailgun or sendgrid
  });

  //   2:Define the email options
  const mailOption = {
    from: "mudassir abbas <mudassirabbas.ma@gmail.com>",
    to: option.email,
    subject: option.subject,
    text: option.message,
    // html:""
  };

  // 3:Actually send the email
  await transporter.sendMail(mailOption);
};
module.exports = sendEmail;
