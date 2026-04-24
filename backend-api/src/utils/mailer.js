import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'gunjan.fdr.swag@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'tqwr hxhc cqyx vzev',
  },
});

export const TEMPLATES = {
  LOGIN_OTP: (otp) => `Dear Customer,\nYour secure login OTP is ${otp}\nThis OTP is valid for 2 minutes Please do not share it with anyone. \nRegards,\nGhar of Ethnics`,
  SIGNUP_OTP: (otp) => `Welcome to Ghar Of Ethnics 🤍 your sign up OTP is ${otp} \nLet’s get you started \nRegards,\nGhar of Ethnics`,
  FORGOT_PASSWORD_OTP: (otp) => `Dear Customer, Your OTP to reset your password is ${otp} The OTP is valid for 2 minutes \nRegards,\nGhar of Ethnics`,
  ORDER_CONFIRMATION: () => `Dear Customer, \nYour order has been placed successfully. We will notify you once it is processed.\nRegards,\nGhar of Ethnics`,
  INVOICE: (orderId) => `Dear Customer, \nYour order has been successfully placed and payment is confirmed.\n\nOrder ID: ${orderId}\n\nYour invoice is attached to this email. Thank you for shopping with us!\nRegards,\nGhar of Ethnics`,
  ORDER_PACKED: () => `Dear Customer, \nYour order has been packed and is ready for dispatch.\nRegards, \nGhar of Ethnics`,
  ORDER_SHIPPED: (trackingLink = '') => `Dear Customer, \nYour Order has been shipped \nTracking link[ ${trackingLink} ]\nRegards,\nGhar of Ethnics`,
  OUT_FOR_DELIVERY: () => `Dear Customer, \nYour order is out for delivery and it will be delivered shortly.\nRegards,\nGhar of Ethnics`,
  DELIVERED: () => `Dear Customer,\nYour order has been successfully delivered.Thank you for shopping with us .\nRegards,\nGhar of Ethnics`,
  ORDER_CANCELLED: () => `Dear Customer, \nYour order has been cancelled successfully. For any assistance please contact us.\nRegards,\nGhar of Ethnics`,
  PAYMENT_SUCCESS: () => `Dear Customer, \nYour payment has been successfully received. Your order is now confirmed.\nRegards,\nGhar of Ethnics`,
  PAYMENT_FAILED: () => `Dear Customer, \nYour payment was unsuccessful.kindly retry or use an alternate payment method. \nRegards, \nGhar of Ethnics`,
  REFUND_INITIATED: () => `Dear Customer, \nYour refund has been initiated it will be processed within (5-6 working days)\nRegards,\nGhar of Ethnics`,
  REFUND_COMPLETED: () => `Dear Customer, \nYour refund has been successfully processed and credited.\nRegards,\nGhar of Ethnics`
};

export const sendMail = async (to, subject, text) => {
  try {
    if(!to) return false;
    const mailOptions = {
      from: process.env.EMAIL_USER || 'gunjan.fdr.swag@gmail.com',
      to,
      subject,
      text
    };
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${subject} to ${to}`);
    return true;
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
    return false;
  }
};

export const sendInvoiceEmail = async (to, subject, text, invoicePDF, invoiceFileName = 'invoice.pdf') => {
  try {
    if(!to) return false;
    const mailOptions = {
      from: process.env.EMAIL_USER || 'gunjan.fdr.swag@gmail.com',
      to,
      subject,
      text,
      attachments: [
        {
          filename: invoiceFileName,
          content: invoicePDF,
          contentType: 'application/pdf'
        }
      ]
    };
    const info = await transporter.sendMail(mailOptions);
    console.log(`Invoice email sent: ${subject} to ${to} with attachment: ${invoiceFileName}`);
    return true;
  } catch (error) {
    console.error(`Error sending invoice email to ${to}:`, error);
    return false;
  }
};
