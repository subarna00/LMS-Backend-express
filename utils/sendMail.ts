require("dotenv").config();
import nodemailer,{Transporter} from "nodemailer"
import path from "path";
import ejs from "ejs"
interface EmailOptions {
    email: string;
    subject: string;
    template: string;
    data: {[key: string]: any}
}

export const sendMail = async ({email,subject,template,data}: EmailOptions)=>{
    const transporter: Transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      //   service: process.env.SMTP_SERVICE,
      auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });
    const templatePath = path.join(__dirname,"../mails",template);

    const html: string = await ejs.renderFile(templatePath,data);

    const mailOptions = {
      from: process.env.SMTP_MAIL,
      to: email,
      subject,
      html
    };
    await transporter.sendMail(mailOptions);
}