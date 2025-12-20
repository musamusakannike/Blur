import nodemailer from "nodemailer"
import logger from "../config/logger.js"

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  })
}

/**
 * Send email
 */
export const sendEmail = async (options) => {
  const transporter = createTransporter()

  const message = {
    from: `${process.env.EMAIL_FROM || "Blur"} <${process.env.EMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  }

  try {
    const info = await transporter.sendMail(message)
    logger.info(`Email sent: ${info.messageId}`)
    return info
  } catch (error) {
    logger.error(`Email error: ${error.message}`)
    throw error
  }
}
