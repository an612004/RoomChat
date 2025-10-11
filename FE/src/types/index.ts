// User interface
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  provider?: string;
  accessToken?: string;
  refreshToken?: string;
}

// Firebase Auth Result
export interface AuthResult {
  user: User;
  credential?: any;
}

// API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Loading state
export interface LoadingStates {
  github: boolean;
  facebook: boolean;
  email: boolean;
}

// Auth Service Response
export interface AuthServiceResponse {
  user: User;
  token: string;
}

// Component Props
export interface ButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

// Form Data
export interface LoginFormData {
  email: string;
  password: string;
}