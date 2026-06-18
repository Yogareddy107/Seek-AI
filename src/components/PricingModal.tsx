/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Check, ShieldCheck, CreditCard, Sparkles, X, Gift } from 'lucide-react';
import { User, SubscriptionPlan } from '../types';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpgradeSuccess: (newPlan: SubscriptionPlan, invoice: any) => void;
}

export default function PricingModal({ isOpen, onClose, currentUser, onUpgradeSuccess }: PricingModalProps) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [paymentGateway, setPaymentGateway] = useState<'stripe' | 'razorpay' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [upiId, setUpiId] = useState('');

  if (!isOpen) return null;

  const plans = [
    {
      id: 'free' as SubscriptionPlan,
      name: 'Free Starter',
      price: 0,
      description: 'Ideal for trial run or personal casual small events.',
      features: [
        '1 Active Event at a time',
        '100 Photos storage limit',
        'Direct guest selfie matching',
        'Standard face pipeline',
        'Basic QR code generator'
      ],
      cta: 'Current Plan',
      popular: false
    },
    {
      id: 'starter' as SubscriptionPlan,
      name: 'Starter Pro',
      price: billingPeriod === 'monthly' ? 19 : 14,
      description: 'Perfect for standard event planners and growing shutterbugs.',
      features: [
        '10 Active Events space',
        '10 GB R2 cloud storage space',
        'Custom QR code customization',
        'FTPS dynamic camera sync list',
        'High resolution downloads',
        'Priority email support'
      ],
      cta: 'Choose Starter',
      popular: false
    },
    {
      id: 'professional' as SubscriptionPlan,
      name: 'Professional Business',
      price: billingPeriod === 'monthly' ? 49 : 39,
      description: 'Best for professional full-time event and wedding photographers.',
      features: [
        '100 Active Events capacity',
        '500 GB cloud storage buffer',
        'Full custom branding & watermarks',
        'AI Best Shot Selection helper',
        'Automatic face descriptor tagger',
        'WhatsApp direct gallery sharing',
        '24/7 Priority chat line'
      ],
      cta: 'Choose Professional',
      popular: true
    },
    {
      id: 'enterprise' as SubscriptionPlan,
      name: 'Enterprise VIP',
      price: billingPeriod === 'monthly' ? 199 : 159,
      description: 'For nationwide agencies and global stadium-scale events.',
      features: [
        'Unlimited active events',
        'Flexible 1+ TB Cloudflare buffer',
        'White label custom domain configuration',
        'SLA 99.9% processing speeds',
        'Unlimited guest faces pipeline',
        'Dedicated account representative'
      ],
      cta: 'Choose Enterprise',
      popular: false
    }
  ];

  const handleSelectPlan = (plan: typeof plans[0]) => {
    if (plan.id === currentUser.subscriptionPlan) return;
    if (plan.price === 0) {
      // Free plan downgrade can happen automatically
      triggerUpgrade(plan.id, 0);
      return;
    }
    setSelectedPlan(plan.id);
    setPaymentGateway('stripe'); // default gateway
  };

  const triggerUpgrade = async (plan: SubscriptionPlan, price: number) => {
    setIsProcessing(true);
    try {
      // 1. Create a secure session
      const createRes = await fetch('/api/payments/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({ planId: plan, billingPeriod })
      });
      const sessionData = await createRes.json();
      
      // 2. Verify / Trigger completion
      const verifyRes = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({
          sessionId: sessionData.sessionId,
          planId: plan,
          billingPeriod
        })
      });
      const verifyData = await verifyRes.json();
      
      if (verifyData.success) {
        onUpgradeSuccess(plan, verifyData.invoice);
        setSelectedPlan(null);
        setPaymentGateway(null);
        onClose();
      }
    } catch (err) {
      console.error(err);
      alert('Simulation payment failed. Reference API logs.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
          <div>
            <h2 className="text-2xl font-bold font-display flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-rose-500 fill-rose-500 animate-pulse" />
              Upgrade PhotoSeek AI Account
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Select a specialized plan to increase storage, unleash FTPS camera automation, and apply branding watermarks.
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          
          {selectedPlan ? (
            /* Gateway Simulator Overlay Screen */
            <div className="max-w-xl mx-auto bg-slate-50 dark:bg-slate-950 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 animate-fade-in">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-full font-mono text-xs font-semibold uppercase tracking-wider">
                  Secure Checkout Simulator
                </div>
                <h3 className="text-xl font-bold mt-3 font-display">
                  Upgrading to {selectedPlan.toUpperCase()} Plan
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Amount due: <span className="font-semibold text-slate-800 dark:text-slate-200">
                    ${plans.find(p => p.id === selectedPlan)?.price}/{billingPeriod === 'monthly' ? 'mo' : 'yr'}
                  </span>
                </p>
              </div>

              {/* Gateway Toggle tabs */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setPaymentGateway('stripe')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg font-medium border text-sm transition-all ${
                    paymentGateway === 'stripe'
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600'
                      : 'border-slate-300 dark:border-slate-800 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  Stripe Checkout
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentGateway('razorpay')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg font-medium border text-sm transition-all ${
                    paymentGateway === 'razorpay'
                      ? 'border-brand-500 bg-brand-50 dark:bg-rose-950/20 text-brand-600'
                      : 'border-slate-300 dark:border-slate-800 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-rose-500" />
                  Razorpay UPI / Visa
                </button>
              </div>

              {paymentGateway === 'stripe' ? (
                /* Stripe Card Form */
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Card Number</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="4242 •••• •••• 4242"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                      />
                      <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Expiry Date</label>
                      <input 
                        type="text" 
                        placeholder="MM/YY"
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">CVC Code</label>
                      <input 
                        type="password" 
                        placeholder="•••"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 flex items-start gap-1 pb-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    Secure sandbox checkout token processing. Raw financial passwords are never saved.
                  </div>
                </div>
              ) : (
                /* Razorpay Form */
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">UPI ID (VPA)</label>
                    <input 
                      type="text" 
                      placeholder="success@upi"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded-lg space-y-1">
                    <span className="text-xs font-medium text-slate-500">Popular Options</span>
                    <div className="flex gap-2 pt-1">
                      <button 
                        type="button" 
                        className="px-2.5 py-1 bg-white dark:bg-slate-800 rounded text-xs border border-slate-200 dark:border-slate-700 font-mono"
                        onClick={() => setUpiId('shutterbug@oksbi')}
                      >
                        shutterbug@oksbi
                      </button>
                      <button 
                        type="button" 
                        className="px-2.5 py-1 bg-white dark:bg-slate-800 rounded text-xs border border-slate-200 dark:border-slate-700 font-mono"
                        onClick={() => setUpiId('payment@okhdfcbank')}
                      >
                        payment@okhdfcbank
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 flex items-start gap-1 pb-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    Razorpay instant routing support. QR code matching works instantly.
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setSelectedPlan(null)}
                  className="flex-1 py-2.5 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-medium text-sm hover:bg-slate-100 dark:hover:bg-slate-900"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => triggerUpgrade(selectedPlan, plans.find(p => p.id === selectedPlan)?.price || 0)}
                  disabled={isProcessing}
                  className="flex-2 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-1.5 transition-all text-center"
                >
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Verifying Payment...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 fill-white" />
                      Complete Sandbox Payment
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Normal pricing list screen */
            <>
              {/* Billing Cycle Trigger Option toggle */}
              <div className="flex justify-center items-center gap-3 mb-10">
                <span className={`text-sm font-semibold transition-all ${billingPeriod === 'monthly' ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400'}`}>
                  Monthly Billing
                </span>
                <button
                  type="button"
                  onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
                  className="w-12 h-6.5 bg-rose-500 hover:bg-rose-600 rounded-full p-1 transition-colors relative flex items-center"
                >
                  <span className={`w-4.5 h-4.5 bg-white rounded-full transition-transform absolute shadow ${billingPeriod === 'yearly' ? 'translate-x-5.5' : 'translate-x-0'}`} />
                </button>
                <span className={`text-sm font-semibold transition-all ${billingPeriod === 'yearly' ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400'}`}>
                  Yearly Billing <span className="inline-block bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">SAVE 20%</span>
                </span>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {plans.map((p) => {
                  const isCurrent = currentUser.subscriptionPlan === p.id;
                  return (
                    <div
                      key={p.id}
                      className={`relative flex flex-col justify-between p-6 rounded-2xl border transition-all ${
                        p.popular 
                          ? 'border-rose-500 bg-rose-50/20 dark:bg-rose-950/10 shadow-lg scale-105 ring-1 ring-rose-500/30' 
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60'
                      }`}
                    >
                      {p.popular && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-rose-600 text-white text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full shadow-md z-10 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 fill-white" />
                          Most Popular
                        </span>
                      )}

                      <div className="space-y-4">
                        <div>
                          <h4 className="text-lg font-bold font-display">{p.name}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 min-h-[40px]">{p.description}</p>
                        </div>

                        <div className="flex items-baseline gap-1 py-2">
                          <span className="text-3xl font-extrabold font-display">${p.price}</span>
                          <span className="text-xs text-slate-400">/{billingPeriod === 'monthly' ? 'mo' : 'yr'}</span>
                        </div>

                        <ul className="space-y-2.5 text-xs">
                          {p.features.map((feat, fi) => (
                            <li key={fi} className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                              <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => handleSelectPlan(p)}
                          disabled={isCurrent}
                          className={`w-full py-2 rounded-xl text-xs font-semibold transition-all ${
                            isCurrent
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed flex items-center justify-center gap-1'
                              : p.popular
                                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/20'
                                : 'bg-slate-900 hover:bg-slate-850 dark:bg-slate-800 dark:hover:bg-slate-700 text-white'
                          }`}
                        >
                          {isCurrent ? (
                            <>
                              <ShieldCheck className="w-4 h-4 text-emerald-500" />
                              Active Plan
                            </>
                          ) : (
                            p.cta
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/70 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 dark:text-slate-500 gap-2">
          <div className="flex items-center gap-1.5">
            <Gift className="w-4 h-4 text-rose-500" />
            Sandbox Mode Enabled. Use simulated visa credentials to transact.
          </div>
          <div>Secure 256-Bit SSL protection</div>
        </div>

      </div>
    </div>
  );
}
