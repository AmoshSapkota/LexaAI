export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface UIContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  showNotification: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export interface Feature {
  title: string;
  description: string;
  icon: string;
}

export interface Testimonial {
  name: string;
  role: string;
  company: string;
  content: string;
  avatar?: string;
  rating: number;
}

export interface FAQ {
  question: string;
  answer: string;
}
