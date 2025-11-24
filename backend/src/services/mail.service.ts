import * as brevo from '@getbrevo/brevo';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Brevo API client with correct types
const apiInstance = new brevo.TransactionalEmailsApi();

// Set API key directly on the instance
(apiInstance as any).authentications['apiKey'].apiKey = process.env.BREVO_API_KEY;

export async function sendVerificationEmail(email: string, token: string) {
  const frontendUrl = process.env.FRONTEND_URL || "https://invenza-ten.vercel.app";
  const verifyUrl = `${frontendUrl}/verify-email?token=${token}`;

  const sendSmtpEmail = new brevo.SendSmtpEmail();
  
  sendSmtpEmail.subject = "Verify your Invenza account";
  sendSmtpEmail.htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 28px;">Welcome to Invenza!</h1>
      </div>
      <div style="padding: 30px; background: #f9f9f9;">
        <h2 style="color: #333; margin-bottom: 20px;">Verify Your Email Address</h2>
        <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
          Thank you for signing up! Please verify your email address by clicking the button below:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" 
             style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p style="color: #999; font-size: 14px; margin-bottom: 10px;">
          Or copy and paste this link in your browser:
        </p>
        <p style="color: #667eea; word-break: break-all; font-size: 14px; background: white; padding: 10px; border-radius: 5px; border: 1px solid #ddd;">
          ${verifyUrl}
        </p>
        <p style="color: #888; font-size: 12px; margin-top: 25px;">
          If you didn't create an account with Invenza, please ignore this email.
        </p>
      </div>
      <div style="background: #333; padding: 20px; text-align: center; color: #999; font-size: 12px;">
        <p style="margin: 0;">&copy; 2024 Invenza. All rights reserved.</p>
      </div>
    </div>
  `;
  
  sendSmtpEmail.sender = {
    name: "Invenza",
    email: "danieldejen23@gmail.com"
  };
  
  sendSmtpEmail.to = [{ email: email }];

  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Verification email sent to: ${email}`);
    console.log('📧 Brevo response:', data);
    return data;
  } catch (error: any) {
    console.error("❌ Brevo API error:", error?.response?.body || error);
    throw error;
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const frontendUrl = process.env.FRONTEND_URL || "https://invenza-ten.vercel.app";
  const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

  const sendSmtpEmail = new brevo.SendSmtpEmail();
  
  sendSmtpEmail.subject = "Reset Your Invenza Password";
  sendSmtpEmail.htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 28px;">Password Reset</h1>
      </div>
      <div style="padding: 30px; background: #f9f9f9;">
        <h2 style="color: #333; margin-bottom: 20px;">Reset Your Password</h2>
        <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
          You requested to reset your password for your Invenza account. Click the button below to create a new password:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background: #f5576c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #999; font-size: 14px; margin-bottom: 10px;">
          Or copy and paste this link in your browser:
        </p>
        <p style="color: #f5576c; word-break: break-all; font-size: 14px; background: white; padding: 10px; border-radius: 5px; border: 1px solid #ddd;">
          ${resetUrl}
        </p>
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
          <p style="color: #856404; margin: 0; font-size: 14px;">
            <strong>Note:</strong> This link will expire in 15 minutes for security reasons.
          </p>
        </div>
        <p style="color: #888; font-size: 12px; margin-top: 25px;">
          If you didn't request a password reset, please ignore this email and your password will remain unchanged.
        </p>
      </div>
      <div style="background: #333; padding: 20px; text-align: center; color: #999; font-size: 12px;">
        <p style="margin: 0;">&copy; 2024 Invenza. All rights reserved.</p>
      </div>
    </div>
  `;
  
  sendSmtpEmail.sender = {
    name: "Invenza",
    email: "noreply@invenza.com"
  };
  
  sendSmtpEmail.to = [{ email: email }];

  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Password reset email sent to: ${email}`);
    console.log('📧 Brevo response:', data);
    return data;
  } catch (error: any) {
    console.error("❌ Brevo API error:", error?.response?.body || error);
    throw error;
  }
}

// Export for notification service
export async function sendEmailNotification(email: string, subject: string, html: string) {
  const sendSmtpEmail = new brevo.SendSmtpEmail();
  
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = html;
  sendSmtpEmail.sender = {
    name: "Invenza",
    email: "noreply@invenza.com"
  };
  sendSmtpEmail.to = [{ email: email }];

  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Notification email sent to: ${email}`);
    return data;
  } catch (error: any) {
    console.error("❌ Brevo API error:", error?.response?.body || error);
    throw error;
  }
}