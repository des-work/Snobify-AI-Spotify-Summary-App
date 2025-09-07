// ============================================================================
// LOADING STATES - Beautiful Loading Components
// ============================================================================

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  text?: string;
}

export function LoadingSpinner({ 
  size = 'medium', 
  color = '#4ecdc4',
  text = 'Loading...'
}: LoadingSpinnerProps) {
  const sizeMap = {
    small: '20px',
    medium: '40px',
    large: '60px',
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div
        style={{
          width: sizeMap[size],
          height: sizeMap[size],
          border: `3px solid ${color}20`,
          borderTop: `3px solid ${color}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      {text && (
        <p style={{
          marginTop: '10px',
          color: color,
          fontSize: '14px',
          fontWeight: '500',
        }}>
          {text}
        </p>
      )}
    </div>
  );
}

interface LoadingDotsProps {
  color?: string;
  text?: string;
}

export function LoadingDots({ 
  color = '#4ecdc4',
  text = 'Loading'
}: LoadingDotsProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: '8px',
              height: '8px',
              backgroundColor: color,
              borderRadius: '50%',
              animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite both`,
            }}
          />
        ))}
      </div>
      {text && (
        <p style={{
          color: color,
          fontSize: '14px',
          fontWeight: '500',
        }}>
          {text}
        </p>
      )}
    </div>
  );
}

interface LoadingPulseProps {
  color?: string;
  text?: string;
}

export function LoadingPulse({ 
  color = '#4ecdc4',
  text = 'Loading'
}: LoadingPulseProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div
        style={{
          width: '40px',
          height: '40px',
          backgroundColor: color,
          borderRadius: '50%',
          animation: 'pulse 2s ease-in-out infinite',
        }}
      />
      {text && (
        <p style={{
          marginTop: '10px',
          color: color,
          fontSize: '14px',
          fontWeight: '500',
        }}>
          {text}
        </p>
      )}
    </div>
  );
}

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
  retryText?: string;
}

export function ErrorState({ 
  error, 
  onRetry,
  retryText = 'Try Again'
}: ErrorStateProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      textAlign: 'center',
      backgroundColor: 'rgba(255, 107, 107, 0.1)',
      borderRadius: '10px',
      border: '1px solid rgba(255, 107, 107, 0.3)',
    }}>
      <div style={{
        fontSize: '48px',
        marginBottom: '16px',
      }}>
        ⚠️
      </div>
      <h3 style={{
        color: '#ff6b6b',
        margin: '0 0 8px 0',
        fontSize: '18px',
      }}>
        Something went wrong
      </h3>
      <p style={{
        color: '#666',
        margin: '0 0 20px 0',
        fontSize: '14px',
        maxWidth: '300px',
      }}>
        {error}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            backgroundColor: '#ff6b6b',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'background-color 0.3s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#ff5252';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#ff6b6b';
          }}
        >
          {retryText}
        </button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: string;
  action?: {
    text: string;
    onClick: () => void;
  };
}

export function EmptyState({ 
  title, 
  description, 
  icon = '📊',
  action
}: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      textAlign: 'center',
    }}>
      <div style={{
        fontSize: '64px',
        marginBottom: '16px',
        opacity: 0.7,
      }}>
        {icon}
      </div>
      <h3 style={{
        color: '#333',
        margin: '0 0 8px 0',
        fontSize: '20px',
        fontWeight: '600',
      }}>
        {title}
      </h3>
      <p style={{
        color: '#666',
        margin: '0 0 20px 0',
        fontSize: '14px',
        maxWidth: '300px',
        lineHeight: '1.5',
      }}>
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          style={{
            backgroundColor: '#4ecdc4',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'background-color 0.3s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#45b7d1';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#4ecdc4';
          }}
        >
          {action.text}
        </button>
      )}
    </div>
  );
}

// ============================================================================
// CSS ANIMATIONS
// ============================================================================

export const LoadingStyles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes bounce {
    0%, 80%, 100% {
      transform: scale(0);
    }
    40% {
      transform: scale(1);
    }
  }

  @keyframes pulse {
    0% {
      transform: scale(0.95);
      opacity: 0.7;
    }
    70% {
      transform: scale(1);
      opacity: 1;
    }
    100% {
      transform: scale(0.95);
      opacity: 0.7;
    }
  }
`;
