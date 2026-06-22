const nodemailer = require('nodemailer');
async function main() {
  try {
    let transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: 'internfirstcry123@gmail.com', pass: 'wiuh gppy nolb yxhl' }
    });
    let info = await transporter.sendMail({
      from: '"Daily Activity Portal" <noreply@dailyactivity.com>',
      to: 'internfirstcry123@gmail.com',
      subject: 'Test',
      text: 'Test'
    });
    console.log('Message sent: ' + info.messageId);
  } catch(e) {
    console.error('Error:', e);
  }
}
main();
