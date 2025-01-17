const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'rushmit.karki10@gmail.com',
    pass: 'ylpk ybwg uqyf lcbw'
  }
});


const sendEmailOtp = (email, otp) => {
  const mailOptions = {
    from: 'rushmit.karki10@gmail.com',
    to: email,
    subject: 'Password Reset OTP',
    text: `Your OTP for password reset is ${otp}`
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
        reject(false);
      } else {
        console.log('Email sent: ' + info.response);
        resolve(true);
      }
    });
  });
};

module.exports = sendEmailOtp;
