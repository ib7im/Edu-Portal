import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = 'An unexpected error occurred.';
      try {
        const parsedError = JSON.parse(this.state.error?.message || '{}');
        if (parsedError.error) {
          errorMessage = `Firestore Error: ${parsedError.error} (Operation: ${parsedError.operationType})`;
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-bg p-4 font-serif">
          <div className="max-w-md w-full bg-surface rounded-[32px] p-8 shadow-xl border border-border text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/10 text-red-500 rounded-full mb-6">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-2xl font-bold text-text mb-4">Something went wrong</h2>
            <p className="text-text/60 mb-8 text-sm leading-relaxed">
              {errorMessage}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-accent text-white font-bold py-4 px-6 rounded-full transition-all flex items-center justify-center gap-3 shadow-lg shadow-accent/20"
            >
              <RefreshCcw size={20} />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
