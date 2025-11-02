import React, { useState, useEffect, useRef } from 'react';
import { Phone, ArrowLeft } from 'lucide-react';
import phoneAuthService from '../services/phoneAuthService';

interface PhoneOTPVerificationProps {
  phoneNumber: string;
  onBack: () => void;
  onSuccess: (user: any, token: string) => void;
}

const PhoneOTPVerification: React.FC<PhoneOTPVerificationProps> = ({
  phoneNumber,
  onBack,
  onSuccess
}) => {
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const recaptchaRef = useRef<HTMLDivElement>(null);

  // Initialize reCAPTCHA when component mounts
  useEffect(() => {
    if (recaptchaRef.current) {
      phoneAuthService.initializeRecaptcha('recaptcha-container');
    }
    
    return () => {
      phoneAuthService.clearRecaptcha();
    };
  }, []);

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0 && !canResend) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setCanResend(true);
    }
  }, [timeLeft, canResend]);

  const handleOtpChange = (index: number, value: string): void => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit when all fields are filled
    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (otpCode?: string): Promise<void> => {
    const codeToVerify = otpCode || otp.join('');
    
    if (codeToVerify.length !== 6) {
      setError('Vui lòng nhập đầy đủ mã OTP');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const result = await phoneAuthService.verifyOTP(codeToVerify);

      if (result.success && result.user && result.token) {
        onSuccess(result.user, result.token);
      } else {
        setError(result.error || 'Xác thực thất bại');
        // Clear OTP on error
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      setError('Có lỗi xảy ra khi xác thực');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async (): Promise<void> => {
    if (!canResend || isResending) return;

    setIsResending(true);
    setError('');
    
    try {
      // Clear previous session
      phoneAuthService.reset();
      
      // Reinitialize reCAPTCHA
      phoneAuthService.initializeRecaptcha('recaptcha-container');
      
      const result = await phoneAuthService.sendOTP(phoneNumber);

      if (result.success) {
        setTimeLeft(60);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        setError(result.error || 'Không thể gửi lại mã OTP');
      }
    } catch (error) {
      setError('Có lỗi xảy ra khi gửi lại mã OTP');
    } finally {
      setIsResending(false);
    }
  };

  const formatPhoneNumber = (phone: string): string => {
    // Format +84xxxxxxxxx to +84 xxx xxx xxx
    if (phone.startsWith('+84')) {
      const number = phone.slice(3);
      return `+84 ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`;
    }
    return phone;
  };

  return (
    <div className="phone-otp-container">
      {/* Hidden reCAPTCHA container */}
      <div id="recaptcha-container" ref={recaptchaRef}></div>
      
      <div className="otp-header">
        <button onClick={onBack} className="back-button">
          <ArrowLeft size={20} />
        </button>
        <div className="otp-icon">
          <Phone size={32} />
        </div>
        <h2>Xác thực số điện thoại</h2>
        <p>
          Mã OTP đã được gửi tới<br />
          <strong>{formatPhoneNumber(phoneNumber)}</strong>
        </p>
      </div>

      <div className="otp-form">
        <div className="otp-inputs">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className={`otp-input ${error ? 'error' : ''}`}
              maxLength={1}
              disabled={isVerifying}
            />
          ))}
        </div>

        {error && <div className="error-message">{error}</div>}

        <button
          onClick={() => handleVerifyOTP()}
          disabled={otp.some(digit => !digit) || isVerifying}
          className={`verify-button ${isVerifying ? 'loading' : ''}`}
        >
          {isVerifying ? (
            <>
              <div className="spinner"></div>
              Đang xác thực...
            </>
          ) : (
            'Xác thực'
          )}
        </button>

        <div className="resend-section">
          {!canResend ? (
            <p>Gửi lại mã sau {timeLeft}s</p>
          ) : (
            <button
              onClick={handleResendOTP}
              disabled={isResending}
              className="resend-button"
            >
              {isResending ? 'Đang gửi...' : 'Gửi lại mã OTP'}
            </button>
          )}
        </div>
      </div>

      <style>{`
        .phone-otp-container {
          width: 100%;
          max-width: 400px;
          padding: 2rem;
          text-align: center;
        }

        .otp-header {
          position: relative;
          margin-bottom: 2rem;
        }

        .back-button {
          position: absolute;
          left: 0;
          top: 0;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 50%;
          transition: background-color 0.2s;
        }

        .back-button:hover {
          background-color: #f3f4f6;
        }

        .otp-icon {
          width: 64px;
          height: 64px;
          background: linear-gradient(45deg, #3b82f6, #8b5cf6);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
          color: white;
        }

        .otp-header h2 {
          margin: 0 0 0.5rem 0;
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
        }

        .otp-header p {
          margin: 0;
          color: #6b7280;
          line-height: 1.5;
        }

        .otp-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .otp-inputs {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
        }

        .otp-input {
          width: 48px;
          height: 56px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          text-align: center;
          font-size: 1.25rem;
          font-weight: 600;
          outline: none;
          transition: all 0.2s;
        }

        .otp-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .otp-input.error {
          border-color: #ef4444;
        }

        .error-message {
          color: #ef4444;
          font-size: 0.875rem;
          margin-top: -0.5rem;
        }

        .verify-button {
          background: linear-gradient(45deg, #3b82f6, #8b5cf6);
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .verify-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .verify-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .resend-section {
          margin-top: 1rem;
        }

        .resend-section p {
          color: #6b7280;
          margin: 0;
        }

        .resend-button {
          background: none;
          border: none;
          color: #3b82f6;
          cursor: pointer;
          font-weight: 500;
          text-decoration: underline;
        }

        .resend-button:hover {
          color: #2563eb;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 480px) {
          .phone-otp-container {
            padding: 1rem;
          }
          
          .otp-inputs {
            gap: 0.25rem;
          }
          
          .otp-input {
            width: 40px;
            height: 48px;
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default PhoneOTPVerification;