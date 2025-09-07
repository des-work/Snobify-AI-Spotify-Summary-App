// ============================================================================
// GLASS CARD - Glass Morphism Card Component
// ============================================================================

import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  hover?: boolean;
  glow?: boolean;
  blur?: 'low' | 'medium' | 'high';
}

export default function GlassCard({ 
  children, 
  className = '',
  style = {},
  hover = true,
  glow = false,
  blur = 'medium'
}: GlassCardProps) {
  const blurMap = {
    low: 'blur(8px)',
    medium: 'blur(12px)',
    high: 'blur(16px)',
  };

  const baseStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: blurMap[blur],
    WebkitBackdropFilter: blurMap[blur],
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: glow 
      ? '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px rgba(78, 205, 196, 0.3)'
      : '0 8px 32px rgba(0, 0, 0, 0.3)',
    padding: '24px',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
    ...style,
  };

  const hoverStyle: React.CSSProperties = hover ? {
    transform: 'translateY(-4px)',
    boxShadow: glow 
      ? '0 12px 40px rgba(0, 0, 0, 0.4), 0 0 30px rgba(78, 205, 196, 0.4)'
      : '0 12px 40px rgba(0, 0, 0, 0.4)',
  } : {};

  return (
    <div
      className={`glass-card ${className}`}
      style={baseStyle}
      onMouseEnter={(e) => {
        if (hover) {
          Object.assign(e.currentTarget.style, hoverStyle);
        }
      }}
      onMouseLeave={(e) => {
        if (hover) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = baseStyle.boxShadow as string;
        }
      }}
    >
      {children}
    </div>
  );
}

// ============================================================================
// GLASS BUTTON - Glass Morphism Button
// ============================================================================

interface GlassButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  className?: string;
  style?: React.CSSProperties;
}

export function GlassButton({ 
  children, 
  onClick, 
  disabled = false,
  variant = 'primary',
  size = 'medium',
  className = '',
  style = {}
}: GlassButtonProps) {
  const variantStyles = {
    primary: {
      background: 'rgba(78, 205, 196, 0.2)',
      border: '1px solid rgba(78, 205, 196, 0.3)',
      color: '#4ecdc4',
    },
    secondary: {
      background: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      color: '#ffffff',
    },
    danger: {
      background: 'rgba(255, 107, 107, 0.2)',
      border: '1px solid rgba(255, 107, 107, 0.3)',
      color: '#ff6b6b',
    },
  };

  const sizeStyles = {
    small: { padding: '8px 16px', fontSize: '12px' },
    medium: { padding: '12px 24px', fontSize: '14px' },
    large: { padding: '16px 32px', fontSize: '16px' },
  };

  const baseStyle: React.CSSProperties = {
    ...variantStyles[variant],
    ...sizeStyles[size],
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    borderRadius: '8px',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s ease',
    fontWeight: '500',
    opacity: disabled ? 0.5 : 1,
    ...style,
  };

  return (
    <button
      className={`glass-button ${className}`}
      style={baseStyle}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      {children}
    </button>
  );
}

// ============================================================================
// GLASS INPUT - Glass Morphism Input
// ============================================================================

interface GlassInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function GlassInput({ 
  value, 
  onChange, 
  placeholder = '',
  type = 'text',
  disabled = false,
  className = '',
  style = {}
}: GlassInputProps) {
  const baseStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    padding: '12px 16px',
    color: '#ffffff',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.3s ease',
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? 'not-allowed' : 'text',
    ...style,
  };

  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`glass-input ${className}`}
      style={baseStyle}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = 'rgba(78, 205, 196, 0.5)';
        e.currentTarget.style.boxShadow = '0 0 20px rgba(78, 205, 196, 0.2)';
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    />
  );
}
