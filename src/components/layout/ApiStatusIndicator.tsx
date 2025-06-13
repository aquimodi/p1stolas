import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { startApiConnectivityCheck } from '../../utils/apiChecker';

interface ApiStatusIndicatorProps {
  className?: string;
  showLabel?: boolean;
}

const ApiStatusIndicator: React.FC<ApiStatusIndicatorProps> = ({
  className = '',
  showLabel = true
}) => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'failed'>('checking');
  
  useEffect(() => {
    // Start periodic checking every 30 seconds
    const cleanup = startApiConnectivityCheck(30000, setStatus);
    
    // Clean up on unmount
    return cleanup;
  }, []);
  
  return (
    <div className={`flex items-center ${className}`}>
      {status === 'checking' && (
        <>
          <Loader2 className="h-4 w-4 text-yellow-500 animate-spin mr-1" />
          {showLabel && <span className="text-xs text-yellow-600">Conectando...</span>}
        </>
      )}
      
      {status === 'connected' && (
        <>
          <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
          {showLabel && <span className="text-xs text-green-600">API Conectada</span>}
        </>
      )}
      
      {status === 'failed' && (
        <>
          <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
          {showLabel && <span className="text-xs text-red-600">API Desconectada</span>}
        </>
      )}
    </div>
  );
};

export default ApiStatusIndicator;