import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId: `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
      errorId: `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

    // Log to console with detailed info
    this.logError(error, errorInfo);
  }

  logError = (error: Error, errorInfo: ErrorInfo) => {
    const errorReport = {
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      componentStack: errorInfo.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      localStorage: this.getLocalStorageInfo(),
      sessionStorage: this.getSessionStorageInfo()
    };

    console.group('🚨 Snobify Error Report');
    console.error('Error ID:', this.state.errorId);
    console.error('Error:', error);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Full Report:', errorReport);
    console.groupEnd();

    // Store in localStorage for debugging
    try {
      const existingErrors = JSON.parse(localStorage.getItem('snobify_errors') || '[]');
      existingErrors.push(errorReport);
      localStorage.setItem('snobify_errors', JSON.stringify(existingErrors.slice(-10))); // Keep last 10 errors
    } catch (e) {
      console.warn('Could not save error to localStorage:', e);
    }
  };

  getLocalStorageInfo = () => {
    try {
      const keys = Object.keys(localStorage);
      return keys.filter(key => key.startsWith('snobify_')).reduce((acc, key) => {
        acc[key] = localStorage.getItem(key);
        return acc;
      }, {} as Record<string, string | null>);
    } catch {
      return {};
    }
  };

  getSessionStorageInfo = () => {
    try {
      const keys = Object.keys(sessionStorage);
      return keys.filter(key => key.startsWith('snobify_')).reduce((acc, key) => {
        acc[key] = sessionStorage.getItem(key);
        return acc;
      }, {} as Record<string, string | null>);
    } catch {
      return {};
    }
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  handleReportBug = () => {
    const { error, errorInfo, errorId } = this.state;
    const bugReport = {
      errorId,
      timestamp: new Date().toISOString(),
      error: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    const mailtoLink = `mailto:bugs@snobify.app?subject=Snobify Bug Report - ${errorId}&body=${encodeURIComponent(JSON.stringify(bugReport, null, 2))}`;
    window.open(mailtoLink);
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          minHeight: '100vh',
          background: 'var(--gradient-secondary)',
          color: 'white',
          padding: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            maxWidth: '600px',
            background: 'rgba(255,255,255,0.1)',
            padding: '32px',
            borderRadius: '20px',
            backdropFilter: 'blur(10px)'
          }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '16px' }}>�� The Snob Encountered an Error</h1>
            
            <div style={{ marginBottom: '24px' }}>
              <p>Error ID: <code style={{ background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: '4px' }}>
                {this.state.errorId}
              </code></p>
              
              <details style={{ marginTop: '16px' }}>
                <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>Error Details</summary>
                <pre style={{
                  background: 'rgba(0,0,0,0.3)',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  overflow: 'auto',
                  maxHeight: '200px'
                }}>
                  {this.state.error?.message}
                  {'\n\n'}
                  {this.state.error?.stack}
                </pre>
              </details>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button className="btn" onClick={this.handleRetry}>
                Try Again
              </button>
              <button className="btn btn-secondary" onClick={this.handleReportBug}>
                Report Bug
              </button>
              <button className="btn btn-secondary" onClick={() => window.location.reload()}>
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
