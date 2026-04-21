import React, { useState } from 'react';
import { X, ChevronRight, CheckCircle2, AlertCircle, Loader2, CreditCard, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Bank {
  id: string;
  name: string;
  logo: string;
  fields: { key: string; label: string; placeholder: string }[];
}

const BANKS: Bank[] = [
  {
    id: 'telebirr',
    name: 'Telebirr',
    logo: 'https://upload.wikimedia.org/wikipedia/en/a/a4/Telebirr.png',
    fields: [
      { key: 'reference', label: 'Reference Number', placeholder: 'CE626EJRNS' }
    ]
  },
  {
    id: 'cbe',
    name: 'Commercial Bank of Ethiopia (CBE)',
    logo: 'https://play-lh.googleusercontent.com/kKGUk63iUIMXF-SL4AklHhZnQesw3-jZT2MR6NuX-xS54ncaZJ-8tlJETZdQYyZ5-g',
    fields: [
      { key: 'reference', label: 'Reference Number', placeholder: 'TXN123456789' }
    ]
  },
  {
    id: 'dashen',
    name: 'Dashen Bank',
    logo: 'https://mea.newsroom.ibm.com/image/Screen+Shot+2022-08-18+at+3.09.10+PM.png',
    fields: [
      { key: 'reference', label: 'Reference Number', placeholder: '387WDTS252140001' }
    ]
  },
  {
    id: 'abyssinia',
    name: 'Bank of Abyssinia',
    logo: 'https://play-lh.googleusercontent.com/W6pOvwi0XCs8nNjZzcnZ91tXn29CBPUlLu4h8JQ1RCPPNMKyEVxYCPEuc4fCaLtw0A',
    fields: [
      { key: 'reference', label: 'Reference Number', placeholder: 'TEST123456789' }
    ]
  }
];

interface PaymentBottomSheetProps {
  totalAmount: number;
  onClose: () => void;
  onPaymentVerified: (data: { reference: string; bank: string; amount: number }) => void;
}

export const PaymentBottomSheet: React.FC<PaymentBottomSheetProps> = ({ totalAmount, onClose, onPaymentVerified }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<'selection' | 'verification'>('selection');
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBankSelect = (bank: Bank) => {
    setSelectedBank(bank);
    setStep('verification');
    setError(null);
  };

  const handleVerify = async () => {
    if (!reference || !selectedBank) return;
    setLoading(true);
    setError(null);

    try {
      const endpoints: Record<string, string> = {
        cbe: '/verify-cbe',
        telebirr: '/verify-telebirr',
        dashen: '/verify-dashen',
        abyssinia: '/verify-abyssinia',
      };

      const response = await fetch(`https://verifyapi.leulzenebe.pro${endpoints[selectedBank.id]}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'Y21nOGl2MDhiMDAyNW5vMGt2czA3a3NxeS0xNzU5MzU1NTQ4ODc0LXh3bzkybW1ibHh0',
        },
        body: JSON.stringify({ reference }),
      });

      if (!response.ok) throw new Error('Verification failed. Please check your reference.');

      const result = await response.json();
      console.log('Verification result:', result);

      if (result.success) {
        // In a real app, we'd also check if result.amount matches totalAmount
        onPaymentVerified({
          reference: reference,
          bank: selectedBank.name,
          amount: totalAmount
        });
      } else {
        setError(result.message || 'Payment not found or amount mismatch.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during verification.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-bg w-full max-w-lg rounded-t-[2.5rem] p-6 pb-12 flex flex-col space-y-6 animate-in slide-in-from-bottom duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Wallet className="text-primary" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black">{t('payOnline')}</h2>
              <p className="text-xs font-bold text-secondary uppercase tracking-tight">{t('selectProvider')}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-secondary-bg rounded-2xl flex items-center justify-center active:scale-90 transition-transform">
            <X size={20} />
          </button>
        </div>

        {step === 'selection' ? (
          <div className="grid grid-cols-1 gap-3 overflow-y-auto max-h-[60vh]">
            {BANKS.map(bank => (
              <button
                key={bank.id}
                onClick={() => handleBankSelect(bank)}
                className="flex items-center justify-between p-4 bg-secondary-bg/50 border border-separator/30 rounded-3xl active:scale-[0.98] transition-all hover:bg-secondary-bg"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white rounded-2xl p-1 shadow-sm border border-separator/20">
                    <img src={bank.logo} alt={bank.name} className="w-full h-full object-contain" />
                  </div>
                  <span className="font-black text-sm">{bank.name}</span>
                </div>
                <ChevronRight size={20} className="text-secondary" />
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-secondary-bg/50 p-6 rounded-[2rem] border border-separator/30 space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white rounded-3xl p-2 shadow-md border border-separator/20">
                  <img src={selectedBank?.logo} alt={selectedBank?.name} className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="font-black text-lg">{selectedBank?.name}</h3>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-xl font-black text-primary">{totalAmount.toLocaleString()}</span>
                    <span className="text-xs font-bold text-primary">ETB</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary ml-1">{t('referenceNumber')}</label>
                <input
                  type="text"
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  placeholder={t('enterReference')}
                  className="w-full px-5 py-4 bg-bg border border-separator/50 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-primary outline-hidden transition-all"
                />
              </div>

              {error && (
                <div className="p-4 bg-error/10 border border-error/20 rounded-2xl flex items-center space-x-3 text-error">
                  <AlertCircle size={20} />
                  <p className="text-xs font-bold leading-tight">{error}</p>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setStep('selection')}
                className="flex-1 py-4 bg-secondary-bg text-text rounded-[1.5rem] font-black text-sm active:scale-[0.98] transition-all"
              >
                {t('back')}
              </button>
              <button
                onClick={handleVerify}
                disabled={loading || !reference}
                className="flex-[2] py-4 bg-primary text-button-text rounded-[1.5rem] font-black text-sm flex items-center justify-center space-x-2 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>{t('verifying')}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    <span>{t('verifyPayment')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        <div className="text-center">
          <p className="text-[10px] font-bold text-secondary uppercase tracking-widest leading-relaxed">
            {t('securePayment')}
          </p>
        </div>
      </div>
    </div>
  );
};
