// ============================================================================
// CONNECTION STATUS COMPONENT - Real-time Connection Monitoring
// ============================================================================

import React, { useState, useEffect } from 'react';
import connectionManager from '../api/connectionManager';
import { logger } from '../utils/debugLogger';

interface ConnectionStatusProps {
  showDetails?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  compact?: boolean;
}

interface ConnectionStatusData {
  isConnected: boolean;
  lastCheck: Date;
  latency: number;
  errors: number;
  uptime: number;
}

export default function ConnectionStatusComponent({ 
  showDetails = false, 
  position = 'top-right',
  compact = false 
}: ConnectionStatusProps) {
  const [status, setStatus] = useState<ConnectionStatusData>(connectionManager.getStatus());
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const unsubscribe = connectionManager.addConnectionListener((newStatus) => {
      setStatus(newStatus);
      logger.debug('CONNECTION_STATUS', 'Status updated', newStatus);
    });

    return unsubscribe;
  }, []);

  const getStatusColor = (): string => {
    if (status.isConnected) {
      if (status.latency < 100) return '#4CAF50'; // Green - excellent
      if (status.latency < 500) return '#8BC34A'; // Light green - good
      if (status.latency < 1000) return '#FFC107'; // Yellow - fair
      return '#FF9800'; // Orange - slow
    }
    return '#F44336'; // Red - disconnected
  };

  const getStatusText = (): string => {
    if (status.isConnected) {
      return `${status.latency}ms`;
    }
    return 'Offline';
  };

  const getStatusIcon = (): string => {
    if (status.isConnected) {
      if (status.latency < 100) return '🟢';
      if (status.latency < 500) return '🟡';
      return '🟠';
    }
    return '🔴';
  };

  const formatUptime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getPositionStyles = () => {
    const baseStyles: React.CSSProperties = {
      position: 'fixed',
      zIndex: 1000,
      padding: compact ? '4px 8px' : '8px 12px',
      borderRadius: '6px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      fontSize: compact ? '12px' : '14px',
      fontFamily: 'monospace',
      border: `2px solid ${getStatusColor()}`,
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      userSelect: 'none',
    };

    switch (position) {
      case 'top-right':
        return { ...baseStyles, top: '20px', right: '20px' };
      case 'top-left':
        return { ...baseStyles, top: '20px', left: '20px' };
      case 'bottom-right':
        return { ...baseStyles, bottom: '20px', right: '20px' };
      case 'bottom-left':
        return { ...baseStyles, bottom: '20px', left: '20px' };
      default:
        return { ...baseStyles, top: '20px', right: '20px' };
    }
  };

  const handleClick = () => {
    setIsVisible(!isVisible);
    logger.info('CONNECTION_STATUS', 'Toggled visibility', { isVisible: !isVisible });
  };

  if (!isVisible) {
    return (
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: getStatusColor(),
          cursor: 'pointer',
          border: '2px solid white',
        }}
        onClick={handleClick}
        title="Show connection status"
      />
    );
  }

  return (
    <div style={getPositionStyles()} onClick={handleClick} title="Click to toggle details">
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '12px' }}>{getStatusIcon()}</span>
        <span style={{ fontWeight: 'bold' }}>{getStatusText()}</span>
        
        {showDetails && (
          <div style={{ marginLeft: '8px', fontSize: '11px', opacity: 0.8 }}>
            <div>Errors: {status.errors}</div>
            <div>Uptime: {formatUptime(status.uptime)}</div>
            <div>Last: {new Date(status.lastCheck).toLocaleTimeString()}</div>
          </div>
        )}
      </div>
      
      {!compact && (
        <div style={{ 
          fontSize: '10px', 
          opacity: 0.7, 
          marginTop: '2px',
          textAlign: 'center' 
        }}>
          {status.isConnected ? 'Connected' : 'Disconnected'}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CONNECTION STATUS HOOK
// ============================================================================

export function useConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatusData>(connectionManager.getStatus());

  useEffect(() => {
    const unsubscribe = connectionManager.addConnectionListener(setStatus);
    return unsubscribe;
  }, []);

  return status;
}

// ============================================================================
// CONNECTION STATUS BADGE (Minimal)
// ============================================================================

export function ConnectionBadge() {
  const status = useConnectionStatus();
  
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 6px',
        borderRadius: '4px',
        backgroundColor: status.isConnected ? '#4CAF50' : '#F44336',
        color: 'white',
        fontSize: '11px',
        fontFamily: 'monospace',
      }}
    >
      <span>{status.isConnected ? '🟢' : '🔴'}</span>
      <span>{status.isConnected ? `${status.latency}ms` : 'Offline'}</span>
    </div>
  );
}