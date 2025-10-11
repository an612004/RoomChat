import React, { useState, useEffect } from 'react';
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import emailOTPService from '../services/emailOTPAuth';

interface OTPVerificationProps {
  email: string;
  sessionToken: string;
  onBack: () => void;
  onSuccess: (user: any, token: string) => void;
}

const OTPVerification: React.FC<OTPVerificationProps> = ({ 
  email, 
  sessionToken, 
  onBack, 
  onSuccess 
}) => {
  const [otpCode, setOtpCode] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleVerifyOTP = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter 6-digit OTP code');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const result = await emailOTPService.verifyOTP(email, otpCode, sessionToken);
      
      if (result.success && result.user && result.token) {
        onSuccess(result.user, result.token);
      } else {
        setError(result.error || 'Invalid or expired OTP code');
      }
    } catch (error: any) {
      setError('An error occurred while verifying OTP');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async (): Promise<void> => {
    setIsResending(true);
    setError('');

    try {
      const result = await emailOTPService.resendOTP(email);
      
      if (result.success) {
        setCountdown(60);
        setCanResend(false);
        // Hiển thị thông báo thành công thay vì alert
        setSuccessMessage('✅ Mã OTP mới đã được gửi đến email của bạn!');
        // Tự động ẩn thông báo sau 3 giây
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(result.error || 'Không thể gửi lại mã OTP. Vui lòng thử lại.');
      }
    } catch (error: any) {
      setError('Có lỗi xảy ra khi gửi lại OTP. Vui lòng thử lại.');
    } finally {
      setIsResending(false);
    }
  };

  const formatOTP = (value: string): string => {
    // Chỉ cho phép số và giới hạn 6 chữ số
    const numbers = value.replace(/[^0-9]/g, '').slice(0, 6);
    return numbers;
  };

  return (
    <div className="otp-container">
      <div className="otp-header">
        <button 
          onClick={onBack}
          className="back-btn"
          type="button"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="otp-title-section">
          <h2 className="otp-title">Xác thực OTP</h2>
          <p className="otp-subtitle">
            Mã xác thực đã được gửi đến
          </p>
          <p className="email-display">{email}</p>
        </div>
      </div>

      <form onSubmit={handleVerifyOTP} className="otp-form">
        <div className="otp-input-group">
          <div className="otp-input-wrapper">
            <Mail className="otp-input-icon" />
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Enter 6-digit OTP code"
              value={otpCode}
              onChange={(e) => {
                console.log('OTP Input change:', e.target.value);
                setOtpCode(formatOTP(e.target.value));
                setError('');
              }}
              onFocus={() => console.log('OTP Input focused')}
              onClick={() => console.log('OTP Input clicked')}
              className="otp-input"
              maxLength={6}
              autoComplete="one-time-code"
              autoFocus
              disabled={false}
              readOnly={false}
              tabIndex={0}
            />
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="success-message">
            {successMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={isVerifying || otpCode.length !== 6}
          className={`verify-btn ${isVerifying ? 'loading' : ''}`}
        >
          {isVerifying ? (
            <div className="loading-spinner"></div>
          ) : (
            <>
              <Mail size={18} />
              Verify OTP
            </>
          )}
        </button>

        {/* Resend Section */}
        <div className="resend-section">
          <p className="resend-text">
            Không nhận được mã xác thực?
          </p>
          
          <div className="resend-info">
            <p className="resend-help-text">
              • Kiểm tra hộp thư spam/junk
              • Đảm bảo địa chỉ email chính xác
              • Kiểm tra kết nối internet
            </p>
          </div>
          
          {canResend ? (
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={isResending}
              className="resend-btn"
            >
              {isResending ? (
                <>
                  <RefreshCw className="animate-spin" size={16} />
                  Đang gửi lại...
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  Gửi lại mã xác thực
                </>
              )}
            </button>
          ) : (
            <div className="countdown-container">
              <span className="countdown-text">
                Có thể gửi lại sau: {countdown}s
              </span>
              <div className="countdown-progress">
                <div 
                  className="countdown-bar" 
                  style={{ width: `${(60 - countdown) / 60 * 100}%` }}
                ></div>
              </div>
            </div>
          )}
          
          <div className="resend-note">
            <p className="note-text">
              💡 Mã OTP có hiệu lực trong 10 phút
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default OTPVerification;