"use client";

import { useState } from 'react';
import { PaymentStatusChecker } from './PaymentStatus';

interface RegistrationPaymentProps {
  userId: string;
  userData: any;
  onComplete: () => void;
}

export function RegistrationPayment({ userId, userData, onComplete }: RegistrationPaymentProps) {
  const [step, setStep] = useState<'form' | 'payment' | 'status'>('form');
  const [phone, setPhone] = useState(userData.phone || '');
  const [checkoutID, setCheckoutID] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const initiatePayment = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/payments/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          phoneNumber: phone,
          fullName: userData.full_name,
          email: userData.email,
          graduationYear: userData.graduation_year
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Payment initiation failed');
      }
      
      setCheckoutID(data.data.checkoutRequestID);
      setStep('status');
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      {step === 'form' && (
        <div className="space-y-4">
          <div>
            <label className="block font-semibold mb-2">Phone Number for M-Pesa</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="0712345678"
            />
          </div>
          
          <button
            onClick={initiatePayment}
            disabled={loading || !phone}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Initiating...' : 'Pay Registration Fee'}
          </button>
          
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </div>
      )}
      
      {step === 'status' && checkoutID && (
        <div className="space-y-4">
          <PaymentStatusChecker
            checkoutRequestID={checkoutID}
            onSuccess={() => {
              setTimeout(() => {
                onComplete();
              }, 2000);
            }}
            onFailure={(errorMsg) => {
              setError(errorMsg);
              setStep('form');
            }}
          />
          
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> If payment doesn't appear, check your phone for the M-Pesa STK Push prompt.
              Enter your M-Pesa PIN when prompted.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}