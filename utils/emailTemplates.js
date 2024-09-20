export const emailVerificationTemplate = (verificationToken) => {
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
    
    return `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h1>Verify Your Email Address</h1>
        <p>Thank you for registering with Mainford. Please verify your email address by clicking the link below:</p>
        <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none;">Verify Email</a>
        <p>If you did not create this account, please ignore this email.</p>
        <br />
        <p>Best Regards,</p>
        <p>Mainford Team</p>
      </div>
    `;
  };
  