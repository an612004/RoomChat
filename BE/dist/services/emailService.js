"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
class EmailService {
    constructor() {
        this.createTransporter();
    }
    createTransporter() {
        // Gmail configuration
        const config = {
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.GMAIL_USER || '', // Your Gmail address
                pass: process.env.GMAIL_APP_PASSWORD || '' // Gmail App Password
            }
        };
        this.transporter = nodemailer_1.default.createTransport(config);
    }
    async sendOTPEmail(email, otpCode) {
        try {
            const mailOptions = {
                to: email,
                subject: '🔐 OTP authentication code - Anbi',
                html: this.generateOTPEmailTemplate(otpCode)
            };
            const info = await this.transporter.sendMail({
                from: `"Anbi Security" <${process.env.GMAIL_USER}>`,
                ...mailOptions
            });
            console.log('✅ OTP Email sent:', info.messageId);
            return true;
        }
        catch (error) {
            console.error('❌ Email sending failed:', error);
            return false;
        }
    }
    generateOTPEmailTemplate(otpCode) {
        return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mã xác thực OTP</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 20px; padding: 40px; box-shadow: 0 20px 40px rgba(0,0,0,0.1);">
      
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 40px;">
        <!-- Vòng tròn chứa logo -->
        <div style="background: linear-gradient(135deg, #667eea, #764ba2); 
                    width: 100px; height: 100px; 
                    border-radius: 50%; 
                    margin: 0 auto 20px; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    overflow: hidden;">
          <!-- 🟢 Thay link logo tại đây -->
          <img src="https://yt3.ggpht.com/ghsUpVhHEs07HWwrLD4Jbf1ULZ0QmMS7x1hIU_cq2rYP7riKkNzNEtvmYKubAIod2tVCYCnlR6c=s88-c-k-c0x00ffffff-no-rj" 
               alt="Logo Anbi" 
               style="width: 105%; height: 105%; object-fit: contain; display: block;">
        </div>

        <h1 style="color: #333; margin: 0; font-size: 28px; font-weight: 700;">Xác thực đăng nhập</h1>
        <p style="color: #666; margin: 10px 0 0; font-size: 16px;">Chào mừng bạn đến với <strong>Anbi</strong>, chúc bạn có trải nghiệm tuyệt vời!</p>
      </div>

      <!-- OTP Section -->
      <div style="text-align: center; margin: 40px 0;">
        <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
          Mã xác thực OTP của bạn là:
        </p>
        
        <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; font-size: 36px; font-weight: bold; letter-spacing: 8px; padding: 20px; border-radius: 12px; margin: 20px 0; display: inline-block; min-width: 200px;">
          ${otpCode}
        </div>
        
        <p style="color: #999; font-size: 14px; margin-top: 20px;">
          Mã này có hiệu lực trong <strong>10 phút</strong>
        </p>
      </div>

      <!-- Instructions -->
      <div style="background: #f8f9fa; border-radius: 12px; padding: 25px; margin: 30px 0;">
        <h3 style="color: #333; margin: 0 0 15px; font-size: 18px;">📋 Hướng dẫn:</h3>
        <ul style="color: #666; margin: 0; padding-left: 20px; line-height: 1.6;">
          <li>Nhập mã OTP này vào trang đăng nhập</li>
          <li>Mã sẽ hết hạn sau 10 phút</li>
          <li>Không chia sẻ mã này với bất kỳ ai</li>
          <li>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email</li>
        </ul>
      </div>

      <!-- Security Note -->
      <div style="border-left: 4px solid #ffc107; background: #fff8e1; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
        <p style="color: #f57c00; margin: 0; font-size: 14px; font-weight: 500;">
          <strong>🔒 Lưu ý bảo mật:</strong> 
          Anbi sẽ không bao giờ yêu cầu bạn cung cấp mã OTP qua điện thoại hoặc email. Nếu có ai đó yêu cầu, có thể đó là hành vi lừa đảo.
        </p>
      </div>

      <!-- Footer -->
      <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 14px; margin: 0;">
          Email này được gửi tự động từ hệ thống Anbi<br>
          Vui lòng không trả lời lại email này
        </p>
        <p style="color: #999; font-size: 12px; margin: 15px 0 0;">
          © 2025 - 2026 Anbi. Mọi quyền được bảo lưu.
        </p>
      </div>
    </div>
  </div>
</body>
</html>

`;
    }
    async verifyConnection() {
        try {
            await this.transporter.verify();
            console.log('✅ Email service connection verified');
            return true;
        }
        catch (error) {
            console.error('❌ Email service connection failed:', error);
            return false;
        }
    }
}
exports.default = new EmailService();
