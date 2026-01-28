"use client";

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface PaymentStatusCheckerProps {
  checkoutRequestID: string;
  onSuccess?: () => void;
  onFailure?: (error: string) => void;
}

export function PaymentStatusChecker({ checkoutRequestID, onSuccess, onFailure }: PaymentStatusCheckerProps) {
  const [status, setStatus] = useState<'pending' | 'processing' | 'confirmed' | 'failed'>('pending');
  const [message, setMessage] = useState('Checking payment status...');
  const [receipt, setReceipt] = useState<string>('');
  const [isChecking, setIsChecking] = useState(false);

  const checkStatus = async () => {
    if (!checkoutRequestID || isChecking) return;
    
    setIsChecking(true);
    try {
      const response = await fetch(`/api/payments/status/${checkoutRequestID}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to check status');
      }
      
      setStatus(data.status);
      setMessage(data.message || '');
      
      if (data.receipt) {
        setReceipt(data.receipt);
      }
      
      if (data.status === 'confirmed') {
        onSuccess?.();
      } else if (data.status === 'failed') {
        onFailure?.(data.message || 'Payment failed');
      }
      
    } catch (error: any) {
      console.error('Status check error:', error);
      setMessage(error.message || 'Error checking status');
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
    
    // Poll every 10 seconds for pending payments
    const interval = setInterval(() => {
      if (status === 'pending' || status === 'processing') {
        checkStatus();
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [checkoutRequestID]);

  const getStatusIcon = () => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="text-green-500" size={24} />;
      case 'failed':
        return <XCircle className="text-red-500" size={24} />;
      case 'processing':
        return <Clock className="text-yellow-500" size={24} />;
      default:
        return <AlertCircle className="text-blue-500" size={24} />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'failed':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'processing':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${getStatusColor()} transition-all duration-300`}>
      <div className="flex items-center gap-3">
        {getStatusIcon()}
        <div className="flex-1">
          <p className="font-semibold">{message}</p>
          {receipt && (
            <p className="text-sm mt-1">
              <span className="font-medium">Receipt:</span> {receipt}
            </p>
          )}
          {(status === 'pending' || status === 'processing') && (
            <p className="text-sm mt-1">
              Checking again in 10 seconds...
            </p>
          )}
        </div>
        {(status === 'pending' || status === 'processing') && (
          <button
            onClick={checkStatus}
            disabled={isChecking}
            className="px-3 py-1 bg-white border rounded text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            {isChecking ? 'Checking...' : 'Check Now'}
          </button>
        )}
      </div>
    </div>
  );
}