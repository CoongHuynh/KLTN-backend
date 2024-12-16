const nodemailer = require("nodemailer");
const { google } = require("googleapis");

const { OAuth2 } = google.auth;
const oauth_link = "https://developers.google.com/oauthplayground";
const { EMAIL, CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN } = process.env;

const auth = new OAuth2(CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN, oauth_link);

exports.sendEmail = async (email, name, url) => {
  try {
    // Thiết lập OAuth2
    auth.setCredentials({
      refresh_token: REFRESH_TOKEN,
    });

    const accessToken = await auth.getAccessToken();

    // Tạo transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: EMAIL,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken.token,
      },
    });

    // Thiết lập nội dung email
    const mailOptions = {
      from: EMAIL,
      to: email,
      subject: "UTE Ecommerce Email Verification",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Verification</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                    color: #333;
                }
                .email-container {
                    width: 100%;
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #fff;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }
                .email-header {
                    background-color: #333;
                    padding: 20px;
                    text-align: center;
                    color: #fff;
                }
                .email-header h1 {
                    margin: 0;
                    font-size: 24px;
                }
                .email-body {
                    padding: 30px;
                }
                .email-body p {
                    font-size: 16px;
                    line-height: 1.5;
                    margin-bottom: 20px;
                }
                .email-body a {
                    display: inline-block;
                    padding: 12px 20px;
                    background-color: #28a745;
                    color: #fff;
                    text-decoration: none;
                    font-weight: bold;
                    border-radius: 5px;
                    margin-bottom: 20px;
                }
                .email-footer {
                    background-color: #f4f4f4;
                    padding: 20px;
                    text-align: center;
                    font-size: 14px;
                    color: #777;
                }
                .email-footer a {
                    color: #333;
                    text-decoration: none;
                }
                .email-footer a:hover {
                    text-decoration: underline;
                }

                /* Media Queries for Laptop/Desktop Optimization */
                @media (min-width: 768px) {
                    body {
                        background-color: #e9ecef;
                    }
                    .email-container {
                        max-width: 800px;
                    }
                    .email-body {
                        padding: 40px;
                    }
                    .email-body a {
                        padding: 14px 28px;
                        font-size: 18px;
                    }
                    .email-footer {
                        font-size: 16px;
                    }
                }

                @media (min-width: 1024px) {
                    .email-container {
                        max-width: 900px;
                    }
                    .email-body {
                        padding: 50px;
                    }
                    .email-body a {
                        padding: 16px 32px;
                        font-size: 20px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <!-- Email Header -->
                <div class="email-header">
                    <h1>UTE Ecommerce</h1>
                </div>

                <!-- Email Body -->
                <div class="email-body">
                    <p>Hello ${name},</p>
                    <p>Thank you for registering with UTE Ecommerce. To complete your registration, please verify your email address by clicking the button below.</p>
                    <a href="${url}">Verify Your Email</a>                
                    <p>If you did not request this email, please ignore it. Your account will not be activated without your verification.</p>
                </div>

                <!-- Email Footer -->
                <div class="email-footer">
                    <p>&copy; 2024 UTE Ecommerce. All rights reserved.</p>
                    <p><a href="#">Contact Support</a> | <a href="#">Privacy Policy</a></p>
                </div>
            </div>
        </body>
        </html>
          `,
    };

    // Gửi email
    const result = await transporter.sendMail(mailOptions);
    return result;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Error sending email");
  }
};

exports.sendCode = async (email, name, code) => {
  try {
    // Thiết lập OAuth2
    auth.setCredentials({
      refresh_token: REFRESH_TOKEN,
    });

    const accessToken = await auth.getAccessToken();

    // Tạo transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: EMAIL,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken.token,
      },
    });

    // Thiết lập nội dung email
    const mailOptions = {
      from: EMAIL,
      to: email,
      subject: "Reset Password Code",
      text: `Hello ${name},\n\nYour reset password code is: ${code}\n\nIf you did not request this, please ignore this email.\n\nThank you,\nYour Company`,
    };

    // Gửi email
    const result = await transporter.sendMail(mailOptions);
    return result;
  } catch (error) {
    console.error("Error sending reset password code:", error);
    throw new Error("Error sending reset password code");
  }
};
