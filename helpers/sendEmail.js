const sgMail = require('@sendgrid/mail');
require('dotenv').config();

const { SENDGRIG_KEY_API, MY_EMAIL } = process.env;

sgMail.setApiKey(SENDGRIG_KEY_API);

/*
data = {
    to: 'telovil949@bubblybank.com',
  
  subject: 'Верификация',
  html: '<p>Верификация пройдена</p>',
} */

const sendEmail = async data => {
  try {
    const email = { ...data, from: MY_EMAIL };
    await sgMail.send(email);
    return true;
  } catch (error) {
    throw error;
  }
};

module.exports = sendEmail;
