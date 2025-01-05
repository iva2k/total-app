// messageService.ts

import nodemailer from 'nodemailer';
import twilio from 'twilio';

import * as env from '$env/static/private';

// Define the structure of a message
export interface IMessage {
  type: 'email' | 'sms'; // Extendable for future types
  to: string;
  subject?: string; // For emails
  body: string;
  [key: string]: any; // For additional properties
}

// Interface for message providers
interface IMessageProvider {
  send(message: IMessage): Promise<void>;
}

// Email Provider Implementation
class EmailProvider implements IMessageProvider {
  private readonly transporter: nodemailer.Transporter;

  constructor() {
    const port = Number(env.EMAIL_PORT) || 587;
    this.transporter = nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS
      }
    });
  }

  async send(message: IMessage): Promise<void> {
    if (!message.subject) {
      throw new Error('Email message must have a subject.');
    }

    const mailOptions: nodemailer.SendMailOptions = {
      from: env.EMAIL_USER,
      to: message.to,
      subject: message.subject,
      text: message.body
      // You can add html: message.html if needed
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`Email sent: ${info.messageId}`);
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }
}

// SMS Provider Implementation using Twilio
class SMSProvider implements IMessageProvider {
  private readonly client: twilio.Twilio;
  private readonly from: string;

  constructor() {
    const accountSid = env.TWILIO_ACCOUNT_SID;
    const authToken = env.TWILIO_AUTH_TOKEN;
    this.from = env.TWILIO_PHONE_NUMBER ?? '';

    if (!accountSid || !authToken || !this.from) {
      throw new Error('Twilio credentials are not properly set in environment variables.');
    }

    this.client = twilio(accountSid, authToken);
  }

  async send(message: IMessage): Promise<void> {
    try {
      const msg = await this.client.messages.create({
        body: message.body,
        from: this.from,
        to: message.to
      });
      // TODO: (when needed) Use msg.price for cost accounting.
      switch (msg.status) {
        case 'canceled':
          throw new Error('SMS message was canceled');
        case 'failed':
          throw new Error(`SMS message failed, ${msg.errorMessage}`);
        case 'undelivered':
          throw new Error(`SMS message was undelivered, ${msg.errorMessage}`);
        // 'queued' | 'sending' | 'sent' | 'delivered' | 'receiving' | 'received' | 'accepted' | 'scheduled' | 'read' | 'partially_delivered' |
      }
      // To receive message delivery progress, set .statusCallback to the URI of status endpoint,
      // which will be called:
      // app.post('/status', (req, res) => { const messageSid = req.body.MessageSid; const messageStatus = req.body.MessageStatus; ... });

      console.log(`SMS sent: ${msg.sid}`);
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  }
}

// Message Service to handle different providers
export class MessageService {
  private providers: { [key: string]: IMessageProvider } = {};

  constructor() {
    // Initialize providers
    this.providers['email'] = new EmailProvider();
    this.providers['sms'] = new SMSProvider();
    // Future providers can be added here
  }

  /**
   * Send a message using the appropriate provider based on message.type
   * @param message IMessage object containing message details
   */
  async sendMessage(message: IMessage): Promise<void> {
    const provider = this.providers[message.type];
    if (!provider) {
      throw new Error(`Unsupported message type: ${message.type}`);
    }

    await provider.send(message);
  }

  /**
   * Register a new message provider
   * @param type The type identifier for the provider
   * @param provider An instance implementing IMessageProvider
   */
  registerProvider(type: string, provider: IMessageProvider): void {
    this.providers[type] = provider;
  }
}

/**
 * Sends test email and SMS messages.
 */
export async function sendTestMessages(): Promise<void> {
  const messageService = new MessageService();

  if (env.TEST_EMAIL_RECIPIENT) {
    try {
      const testEmail: IMessage = {
        type: 'email',
        to: env.TEST_EMAIL_RECIPIENT,
        subject: 'Test Email',
        body: 'This is a test email sent from the server.'
      };
      console.log('Sending test email...');
      await messageService.sendMessage(testEmail);
      console.log('Test email sent successfully.');
    } catch (error) {
      console.error('Error sending test email:', error);
    }
  }

  if (env.TEST_SMS_RECIPIENT) {
    try {
      const testSMS: IMessage = {
        type: 'sms',
        to: env.TEST_SMS_RECIPIENT,
        body: 'This is a test SMS sent from the server.'
      };
      console.log('Sending test SMS...');
      await messageService.sendMessage(testSMS);
      console.log('Test SMS sent successfully.');
    } catch (error) {
      console.error('Error sending test SMS:', error);
    }
  }
}
