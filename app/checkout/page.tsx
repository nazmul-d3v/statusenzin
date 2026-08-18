'use client';

import React, { useEffect, useState, useMemo, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Footer } from '@/components/Footer';
import { api } from '@/lib/api';
import {
  ShieldCheck,
  Lock,
  CreditCard,
  CheckCircle2,
  ArrowLeft,
  Check,
  Building2,
  Tag,
  RefreshCw,
  AlertCircle,
  Globe,
  ChevronRight
} from 'lucide-react';

// Authentic SVG Logos for Accepted Credit Cards
const VisaLogo = ({ className = "h-5 w-auto" }: { className?: string }) => (
  <svg viewBox="0 0 48 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="48" height="32" rx="4" fill="#0E4595" />
    <path d="M19.4 21H16.8L18.4 11H21L19.4 21ZM29.8 11.3C29.3 11.1 28.5 10.9 27.5 10.9C24.9 10.9 23.1 12.3 23.1 14.2C23.1 15.6 24.4 16.4 25.4 16.9C26.4 17.4 26.7 17.7 26.7 18.1C26.7 18.7 25.9 19 25.2 19C24.1 19 23.5 18.8 22.8 18.5L22.4 18.3L22 20.8C22.8 21.1 24 21.4 25.3 21.4C28.1 21.4 29.9 20 29.9 17.9C29.9 16.4 28.9 15.6 27.5 14.9C26.7 14.5 26.3 14.2 26.3 13.7C26.3 13.3 26.8 12.9 27.7 12.9C28.5 12.9 29.2 13.1 29.7 13.3L29.9 13.4L30.3 11.1L29.8 11.3ZM36.5 11H34.4C33.7 11 33.2 11.2 33 11.7L28.9 21H31.7L32.3 19.3H35.7L36 21H38.5L36.5 11ZM33 17.4L34.4 13.5L35.2 17.4H33ZM15.4 11L12.9 17.8L12.6 16.3C12.1 14.7 10.6 12.8 8.8 11.9L11.1 21H13.9L18.1 11H15.4Z" fill="white" />
    <path d="M10.7 11H6.7L6.6 11.2C9.7 12 11.9 13.9 12.8 16.2L11.9 11.7C11.7 11.2 11.2 11 10.7 11Z" fill="#FAA61A" />
  </svg>
);

const MastercardLogo = ({ className = "h-5 w-auto" }: { className?: string }) => (
  <svg viewBox="0 0 48 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="48" height="32" rx="4" fill="#141414" stroke="#262626" strokeWidth="1" />
    <circle cx="19" cy="16" r="9" fill="#EB001B" />
    <circle cx="29" cy="16" r="9" fill="#F79E1B" />
    <path d="M24 9.5A8.95 8.95 0 0 0 20.7 16A8.95 8.95 0 0 0 24 22.5A8.95 8.95 0 0 0 27.3 16A8.95 8.95 0 0 0 24 9.5Z" fill="#FF5F00" />
  </svg>
);

const AmexLogo = ({ className = "h-5 w-auto" }: { className?: string }) => (
  <svg viewBox="0 0 48 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="48" height="32" rx="4" fill="#006FCF" />
    <path d="M7.5 12.5H10.8L12.4 16.2L14 12.5H17.3V19.5H15.2V15.2L13.3 19.5H11.6L9.7 15.2V19.5H7.5V12.5ZM18.5 12.5H24.2V14.3H20.6V15.1H23.8V16.8H20.6V17.7H24.2V19.5H18.5V12.5ZM25.3 12.5H27.5L29.2 15.4L30.9 12.5H33.1L30.4 16L33.3 19.5H31L29.2 16.5L27.4 19.5H25.2L28.1 16L25.3 12.5Z" fill="white" />
  </svg>
);

const DiscoverLogo = ({ className = "h-5 w-auto" }: { className?: string }) => (
  <svg viewBox="0 0 48 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="48" height="32" rx="4" fill="#231F20" stroke="#262626" strokeWidth="1" />
    <path d="M6 13H10.2C12.2 13 13.5 14.1 13.5 16C13.5 17.9 12.2 19 10.2 19H6V13ZM8.2 17.3H10C11.1 17.3 11.5 16.8 11.5 16C11.5 15.2 11.1 14.7 10 14.7H8.2V17.3ZM14.8 13H17V19H14.8V13ZM17.8 17.8L19 16.4C19.7 17.1 20.5 17.5 21.4 17.5C22.2 17.5 22.6 17.1 22.6 16.6C22.6 16 21.9 15.7 20.6 15.3C19 14.8 18.1 14.2 18.1 13C18.1 11.7 19.3 10.8 21 10.8C22.3 10.8 23.4 11.3 24.2 12.1L23 13.4C22.4 12.8 21.7 12.5 21 12.5C20.2 12.5 19.8 12.8 19.8 13.3C19.8 13.8 20.4 14 21.6 14.4C23.3 14.9 24.3 15.5 24.3 16.7C24.3 18.1 23 19.2 21.1 19.2C19.6 19.2 18.5 18.6 17.8 17.8Z" fill="white" />
    <circle cx="30" cy="16" r="3.8" fill="#F47216" />
    <path d="M35.5 13H39.8V14.7H37.1V15.2H39.4V16.8H37.1V17.3H39.8V19H35.5V13Z" fill="white" />
  </svg>
);

// Comprehensive list of countries for billing address selection
const COUNTRY_LIST = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'AT', name: 'Austria' },
  { code: 'BE', name: 'Belgium' },
  { code: 'BR', name: 'Brazil' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'CL', name: 'Chile' },
  { code: 'CN', name: 'China' },
  { code: 'CO', name: 'Colombia' },
  { code: 'HR', name: 'Croatia' },
  { code: 'CY', name: 'Cyprus' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'DK', name: 'Denmark' },
  { code: 'EG', name: 'Egypt' },
  { code: 'EE', name: 'Estonia' },
  { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'GR', name: 'Greece' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'HU', name: 'Hungary' },
  { code: 'IS', name: 'Iceland' },
  { code: 'IN', name: 'India' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IL', name: 'Israel' },
  { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },
  { code: 'LV', name: 'Latvia' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'MT', name: 'Malta' },
  { code: 'MX', name: 'Mexico' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'NO', name: 'Norway' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'PH', name: 'Philippines' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'RO', name: 'Romania' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'SG', name: 'Singapore' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'KR', name: 'South Korea' },
  { code: 'ES', name: 'Spain' },
  { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'TH', name: 'Thailand' },
  { code: 'TR', name: 'Turkey' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'VN', name: 'Vietnam' },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

const cardElementOptions = {
  style: {
    base: {
      color: '#ffffff',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      fontSize: '12px',
      fontSmoothing: 'antialiased',
      '::placeholder': { color: '#525252' },
    },
    invalid: {
      color: '#f87171',
      iconColor: '#f87171',
    },
  },
  hidePostalCode: true,
};

type FieldErrors = {
  fullName?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  cardHolderName?: string;
  card?: string;
  terms?: string;
};

function fieldInputClass(hasError: boolean) {
  return `w-full rounded-lg bg-neutral-900 border px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none transition ${
    hasError
      ? 'border-red-500/60 focus:border-red-400'
      : 'border-neutral-800 focus:border-[#30ff87]'
  }`;
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stripe = useStripe();
  const elements = useElements();

  // Initial plan from query parameter ('pro' or 'business')
  const initialPlanParam = searchParams.get('plan');
  const [selectedPlan, setSelectedPlan] = useState<'Pro' | 'Business'>(
    initialPlanParam?.toLowerCase() === 'business' ? 'Business' : 'Pro'
  );

  // Billing Cycle: 'monthly' or 'annual'
  const initialCycleParam = searchParams.get('cycle');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(
    initialCycleParam?.toLowerCase() === 'annual' ? 'annual' : 'monthly'
  );

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('US');

  const [cardHolderName, setCardHolderName] = useState('');
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; percent: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successResult, setSuccessResult] = useState<any>(null);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);

  // Prices are fetched from the backend (which reads live amounts from the Stripe dashboard).
  // Hardcoded defaults act as a fallback while loading or in dev mode.
  const DEFAULT_PRICES: Record<string, { monthly: number; annual: number }> = {
    Pro: { monthly: 15, annual: 144 },
    Business: { monthly: 49, annual: 470 },
  };
  const [prices, setPrices] = useState(DEFAULT_PRICES);

  // Require login before checkout
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('statusenzin_token');
      if (!token) {
        const redirectPath = `/checkout${window.location.search}`;
        router.replace(`/login?redirect=${encodeURIComponent(redirectPath)}`);
      }
    }
  }, [router]);

  // Prefill email from logged-in user if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('statusenzin_user');
      if (storedUser) {
        try {
          const userObj = JSON.parse(storedUser);
          if (userObj.email) setEmail(userObj.email);
          if (userObj.fullName) {
            setFullName(userObj.fullName);
            setCardHolderName(userObj.fullName);
          }
        } catch (e) {
          console.error('Failed to parse stored user profile', e);
        }
      }
    }
  }, []);

  // Fetch current plan to compute the prorated upgrade charge
  useEffect(() => {
    api
      .get('/billing/subscription')
      .then((res) => {
        setCurrentSubscription(res.data);
        const current = res.data?.planType ?? 'Starter';
        if ((current === 'Pro' || current === 'Business') && selectedPlan !== 'Business') {
          setSelectedPlan('Business');
        }
      })
      .catch(() => {});
  }, []);

  // Fetch live prices from Stripe so display amounts match the dashboard
  useEffect(() => {
    api
      .get('/billing/prices')
      .then((res) => {
        const list = res.data?.prices;
        if (!Array.isArray(list) || list.length === 0) return;
        const next: Record<string, { monthly: number; annual: number }> = {
          Pro: { ...DEFAULT_PRICES.Pro },
          Business: { ...DEFAULT_PRICES.Business },
        };
        list.forEach((p: any) => {
          const entry = next[p.plan];
          if (!entry) return;
          const key = p.billingCycle === 'annual' ? 'annual' : 'monthly';
          const amount = Number(p.amount);
          if (!Number.isNaN(amount) && amount > 0) entry[key] = amount;
        });
        setPrices(next);
      })
      .catch(() => {});
  }, []);

  const validateForm = useCallback((): FieldErrors => {
    const errors: FieldErrors = {};

    if (!fullName.trim()) {
      errors.fullName = 'Full name is required';
    } else if (fullName.trim().length < 2) {
      errors.fullName = 'Enter at least 2 characters';
    }

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!EMAIL_REGEX.test(email.trim())) {
      errors.email = 'Enter a valid email address';
    }

    if (!address.trim()) {
      errors.address = 'Street address is required';
    }

    if (!city.trim()) {
      errors.city = 'City is required';
    }

    if (!state.trim()) {
      errors.state = 'State / Province is required';
    }

    if (!zip.trim()) {
      errors.zip = 'ZIP / Postal code is required';
    }

    if (!cardHolderName.trim()) {
      errors.cardHolderName = 'Cardholder name is required';
    }

    if (!cardComplete) {
      errors.card = cardError || 'Please complete your card details';
    }

    if (!agreeTerms) {
      errors.terms = 'You must accept the Terms of Service';
    }

    return errors;
  }, [fullName, email, address, city, state, zip, cardHolderName, cardComplete, cardError, agreeTerms]);

  const handleCardChange = (event: { complete: boolean; error?: { message?: string } }) => {
    setCardComplete(event.complete);
    setCardError(event.error?.message || '');
    if (event.complete || event.error) {
      setFieldErrors((prev) => ({ ...prev, card: undefined }));
    }
  };

  const clearFieldError = (field: keyof FieldErrors) => {
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // Pricing calculations (amounts come from Stripe via /billing/prices)
  const planFeatures: Record<string, string[]> = {
    Pro: [
      '25 High-frequency Monitors',
      '1-Minute Ping Interval',
      '3 Public Status Pages',
      '1 Year History Retention',
      'Instant Real-time Email Alerts'
    ],
    Business: [
      '100 High-frequency Monitors',
      '30-Second Ping Interval',
      '10 Public Status Pages',
      '2 Years History Retention',
      'Priority 24/7 SLA Support'
    ]
  };

  const getPlanPrice = (plan: string, cycle: 'monthly' | 'annual') =>
    prices[plan]?.[cycle] ?? 0;
  const getPlanRank = (plan: string) => (plan === 'Business' ? 2 : plan === 'Pro' ? 1 : 0);

  const currentPlanObj = { features: planFeatures[selectedPlan] ?? [] };
  const currentPlanType = currentSubscription?.planType ?? 'Starter';
  const currentPlanPrice = getPlanPrice(currentPlanType, billingCycle);
  const basePrice = getPlanPrice(selectedPlan, billingCycle);
  const discountRate = appliedCoupon ? appliedCoupon.percent : 0;
  const discountAmount = Math.round(basePrice * discountRate * 100) / 100;
  const proratedDue = Math.max(0, Math.round((basePrice - discountAmount - currentPlanPrice) * 100) / 100);
  const finalPrice = proratedDue;

  // Apply Coupon Handler
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');

    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    if (code === 'SAVE20' || code === 'WELCOME20') {
      setAppliedCoupon({ code, percent: 0.2 });
      setCouponSuccess('20% discount applied!');
    } else if (code === 'PROMO10') {
      setAppliedCoupon({ code, percent: 0.1 });
      setCouponSuccess('10% promo discount applied!');
    } else if (code === 'HALFPRICE') {
      setAppliedCoupon({ code, percent: 0.5 });
      setCouponSuccess('50% discount applied!');
    } else {
      setCouponError('Invalid coupon code. Try SAVE20');
    }
  };

  // Submit Payment Handler
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstError = Object.values(errors)[0];
      setErrorMsg(firstError || 'Please fix the highlighted fields.');
      return;
    }

    if (!stripe || !elements) {
      setErrorMsg('Payment system is still loading. Please wait a moment and try again.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setErrorMsg('Card input is not ready. Please refresh and try again.');
      return;
    }

    setProcessing(true);
    setProcessingStage('Securing payment details with Stripe...');

    try {
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: cardHolderName.trim() || fullName.trim(),
          email: email.trim(),
          address: {
            line1: address || undefined,
            city: city || undefined,
            state: state || undefined,
            postal_code: zip || undefined,
            country: country || undefined,
          },
        },
      });

      if (pmError) {
        setFieldErrors((prev) => ({ ...prev, card: pmError.message }));
        setErrorMsg(pmError.message || 'Card validation failed.');
        return;
      }

      setProcessingStage('Provisioning StatusEnzin subscription...');

      const response = await api.post('/billing/process-payment', {
        planType: selectedPlan,
        billingCycle,
        fullName: fullName.trim(),
        email: email.trim(),
        paymentMethodId: paymentMethod.id,
        address,
        city,
        state,
        zip,
        country,
        couponCode: appliedCoupon?.code,
      });

      if (response.data?.success) {
        setSuccessResult(response.data);
      } else {
        setErrorMsg(response.data?.message || 'Payment processing failed. Please check your card details.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.response?.data?.message || err.message || 'Payment authorization failed. Please try again.'
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-vercel-text flex flex-col justify-between selection:bg-[#30ff87] selection:text-black">
      {/* Header with official logo & security badge */}
      <header className="border-b border-neutral-800/80 bg-black/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Billing</span>
            </Link>
            <div className="h-4 w-px bg-neutral-800" />
            <Link href="/" className="flex items-center gap-3 transition hover:opacity-90">
              <img
                src="/logo.png"
                alt="StatusEnzin Logo"
                className="h-8 sm:h-10 w-auto object-contain"
              />
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5 text-[#30ff87]" />
              <span className="font-mono text-[11px] font-semibold">256-BIT SSL ENCRYPTED</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <Lock className="h-3.5 w-3.5 text-[#30ff87]" />
              <span className="hidden md:inline font-mono text-[11px]">PCI-DSS COMPLIANT</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Checkout Container */}
      <main className="mx-auto max-w-7xl w-full px-4 py-10 sm:px-6 flex-1">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Checkout
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Complete your subscription to unlock high-frequency uptime monitoring, instant email alerts, and custom status pages.
          </p>
        </div>

        {/* Error Alert if any */}
        {errorMsg && (
          <div className="mb-8 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-200 flex items-start gap-3 animate-in fade-in">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs leading-relaxed">
              <span className="font-bold block text-red-300 mb-0.5">Payment Notice</span>
              {errorMsg}
            </div>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-12 items-start">
          {/* Left Column: Card Payment Form (7 Columns) */}
          <div className="lg:col-span-7 space-y-8">
            <form onSubmit={handleSubmitPayment} className="space-y-8">
              {/* Section 1: Contact Information */}
              <div className="vercel-card rounded-2xl p-6 bg-neutral-950/80 border border-neutral-800">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-800">
                  <Building2 className="h-4 w-4 text-[#30ff87]" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    1. Contact Information
                  </h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        clearFieldError('fullName');
                      }}
                      placeholder="Alex Mercer"
                      className={fieldInputClass(!!fieldErrors.fullName)}
                    />
                    {fieldErrors.fullName && (
                      <p className="text-[11px] text-red-400 mt-1">{fieldErrors.fullName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Account Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        clearFieldError('email');
                      }}
                      placeholder="alex@company.com"
                      className={fieldInputClass(!!fieldErrors.email)}
                    />
                    {fieldErrors.email && (
                      <p className="text-[11px] text-red-400 mt-1">{fieldErrors.email}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: Billing Address */}
              <div className="vercel-card rounded-2xl p-6 bg-neutral-950/80 border border-neutral-800">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-800">
                  <Globe className="h-4 w-4 text-[#30ff87]" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    2. Billing Address
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value);
                        clearFieldError('address');
                      }}
                      placeholder="100 Innovation Way, Suite 400"
                      className={fieldInputClass(!!fieldErrors.address)}
                    />
                    {fieldErrors.address && (
                      <p className="text-[11px] text-red-400 mt-1">{fieldErrors.address}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">City *</label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => {
                          setCity(e.target.value);
                          clearFieldError('city');
                        }}
                        placeholder="San Francisco"
                        className={fieldInputClass(!!fieldErrors.city)}
                      />
                      {fieldErrors.city && (
                        <p className="text-[11px] text-red-400 mt-1">{fieldErrors.city}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">State / Province *</label>
                      <input
                        type="text"
                        required
                        value={state}
                        onChange={(e) => {
                          setState(e.target.value);
                          clearFieldError('state');
                        }}
                        placeholder="CA"
                        className={fieldInputClass(!!fieldErrors.state)}
                      />
                      {fieldErrors.state && (
                        <p className="text-[11px] text-red-400 mt-1">{fieldErrors.state}</p>
                      )}
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">ZIP / Postal Code *</label>
                      <input
                        type="text"
                        required
                        value={zip}
                        onChange={(e) => {
                          setZip(e.target.value);
                          clearFieldError('zip');
                        }}
                        placeholder="94105"
                        className={fieldInputClass(!!fieldErrors.zip)}
                      />
                      {fieldErrors.zip && (
                        <p className="text-[11px] text-red-400 mt-1">{fieldErrors.zip}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">Country</label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3.5 py-2.5 text-xs text-white focus:border-[#30ff87] focus:outline-none transition cursor-pointer"
                    >
                      {COUNTRY_LIST.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Credit Card Details */}
              <div className="vercel-card rounded-2xl p-6 bg-neutral-950/80 border border-neutral-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 h-32 w-32 bg-[#30ff87]/5 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-neutral-800">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-[#30ff87]" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                      3. Card Payment Details
                    </h3>
                  </div>

                  {/* Original Card Logos Badge */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-neutral-500 mr-1">ACCEPTED CARDS:</span>
                    <VisaLogo className="h-5 w-auto" />
                    <MastercardLogo className="h-5 w-auto" />
                    <AmexLogo className="h-5 w-auto" />
                    <DiscoverLogo className="h-5 w-auto" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Cardholder Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={cardHolderName}
                      onChange={(e) => {
                        setCardHolderName(e.target.value);
                        clearFieldError('cardHolderName');
                      }}
                      placeholder="Name as it appears on card"
                      className={fieldInputClass(!!fieldErrors.cardHolderName)}
                    />
                    {fieldErrors.cardHolderName && (
                      <p className="text-[11px] text-red-400 mt-1">{fieldErrors.cardHolderName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Card Details *
                    </label>
                    <div
                      className={`rounded-lg bg-neutral-900 border px-3.5 py-3 transition ${
                        fieldErrors.card
                          ? 'border-red-500/60'
                          : 'border-neutral-800 focus-within:border-[#30ff87]'
                      }`}
                    >
                      <CardElement options={cardElementOptions} onChange={handleCardChange} />
                    </div>
                    {fieldErrors.card && (
                      <p className="text-[11px] text-red-400 mt-1">{fieldErrors.card}</p>
                    )}
                    <p className="text-[10px] text-neutral-500 mt-2">
                      Card data is collected securely by Stripe and never touches our servers.
                    </p>
                  </div>
                </div>
              </div>

              {/* Coupon Code Section */}
              <div className="vercel-card rounded-2xl p-4 bg-neutral-950/80 border border-neutral-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-[#30ff87]" />
                    <span className="text-xs font-bold text-white font-mono">Promo Code / Coupon</span>
                  </div>
                  {appliedCoupon && (
                    <span className="text-[11px] font-mono text-[#30ff87]">
                      {appliedCoupon.code} ({appliedCoupon.percent * 100}% OFF)
                    </span>
                  )}
                </div>

                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Enter code (e.g. SAVE20)"
                    className="flex-1 rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs uppercase font-mono text-white placeholder-neutral-600 focus:border-[#30ff87] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="rounded-lg bg-neutral-800 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-700 transition cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
                {couponError && <p className="text-[11px] text-red-400 mt-1.5">{couponError}</p>}
                {couponSuccess && <p className="text-[11px] text-[#30ff87] mt-1.5">{couponSuccess}</p>}
              </div>

              {/* Terms Agreement Checkbox */}
              <div className={`flex items-start gap-3 rounded-xl bg-neutral-900/40 p-4 border ${
                fieldErrors.terms ? 'border-red-500/40' : 'border-neutral-800'
              }`}>
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreeTerms}
                  onChange={(e) => {
                    setAgreeTerms(e.target.checked);
                    clearFieldError('terms');
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-neutral-700 bg-neutral-800 text-[#30ff87] focus:ring-[#30ff87] cursor-pointer"
                />
                <label htmlFor="terms" className="text-xs text-neutral-400 leading-relaxed cursor-pointer">
                  I agree to the{' '}
                  <Link href="/terms" target="_blank" className="text-white underline hover:text-[#30ff87]">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" target="_blank" className="text-white underline hover:text-[#30ff87]">
                    Privacy Policy
                  </Link>
                  . I authorize StatusEnzin to charge ${finalPrice.toFixed(2)} today for the prorated upgrade to{' '}
                  {selectedPlan}, then the full {billingCycle} plan price on each renewal until I cancel.
                </label>
              </div>
              {fieldErrors.terms && (
                <p className="text-[11px] text-red-400 -mt-4">{fieldErrors.terms}</p>
              )}

              {currentPlanType === 'Business' && (
                <p className="text-[11px] text-neutral-400 -mt-1 text-center">
                  You are already on the highest available plan. Downgrades can be scheduled from the billing
                  dashboard.
                </p>
              )}

              {/* Professional Payment Action Button */}
              <button
                type="submit"
                disabled={processing || !stripe || currentPlanType === 'Business'}
                className="relative w-full rounded-xl bg-[#30ff87] text-black py-4 px-5 text-base font-bold tracking-tight transition-all duration-300 shadow-[0_4px_24px_rgba(48,255,135,0.2)] hover:bg-[#3dff91] hover:shadow-[0_6px_32px_rgba(48,255,135,0.35)] active:scale-[0.995] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 group cursor-pointer"
              >
                {processing ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span className="font-medium">{processingStage || 'Processing Payment...'}</span>
                  </>
                ) : currentPlanType === 'Business' ? (
                  <span className="font-semibold">No Upgrade Available</span>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    <span className="font-semibold">Pay ${finalPrice.toFixed(2)} USD</span>
                    <span className="h-4 w-px bg-black/20" aria-hidden="true" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] opacity-70">
                      {billingCycle}
                    </span>
                    <ChevronRight className="h-4 w-4 ml-auto transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Order Summary & Guarantee (5 Columns) */}
          <div className="lg:col-span-5 space-y-6 sticky top-24">
            {/* Selected Plan Summary Card */}
            <div className="vercel-card rounded-2xl p-6 bg-neutral-950/90 border border-neutral-800 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
                  ORDER SUMMARY
                </span>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-mono text-emerald-400 border border-emerald-500/20">
                  SECURE CHECKOUT
                </span>
              </div>

              {/* Plan Switcher Tabs */}
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-neutral-900 p-1 mb-6 border border-neutral-800">
                {(['Pro', 'Business'] as const).map((tabPlan) => {
                  const isCurrent = tabPlan === currentPlanType;
                  const isDowngrade = getPlanRank(tabPlan) < getPlanRank(currentPlanType);
                  const disabled = isCurrent || isDowngrade;
                  const tabPrice = billingCycle === 'annual'
                    ? `$${getPlanPrice(tabPlan, 'annual')}/yr`
                    : `$${getPlanPrice(tabPlan, 'monthly')}/mo`;
                  return (
                    <button
                      key={tabPlan}
                      type="button"
                      disabled={disabled}
                      onClick={() => setSelectedPlan(tabPlan)}
                      title={disabled ? (isDowngrade ? 'Downgrades are scheduled from the billing dashboard' : 'You are already on this plan') : ''}
                      className={`rounded-lg py-2 text-xs font-bold transition ${
                        selectedPlan === tabPlan
                          ? 'bg-neutral-800 text-white shadow'
                          : 'text-neutral-400 hover:text-white'
                      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {tabPlan} ({tabPrice})
                      {isCurrent && ' · Current'}
                    </button>
                  );
                })}
              </div>

              {/* Monthly vs Annual Switcher */}
              <div className="rounded-xl border border-[#30ff87]/30 bg-[#30ff87]/5 p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">Billing Frequency</span>
                    <span className="text-[11px] text-[#30ff87] font-mono">Save 20% on Annual Plans</span>
                  </div>
                  <div className="flex items-center rounded-lg bg-neutral-900 p-1 border border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setBillingCycle('monthly')}
                      className={`rounded px-3 py-1 text-xs font-semibold transition cursor-pointer ${
                        billingCycle === 'monthly' ? 'bg-[#30ff87] text-black font-bold' : 'text-neutral-400'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingCycle('annual')}
                      className={`rounded px-3 py-1 text-xs font-semibold transition cursor-pointer ${
                        billingCycle === 'annual' ? 'bg-[#30ff87] text-black font-bold' : 'text-neutral-400'
                      }`}
                    >
                      Annual (-20%)
                    </button>
                  </div>
                </div>
              </div>

              {/* Selected Plan Details */}
              <div className="border-b border-neutral-800 pb-6 mb-6">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-2xl font-extrabold text-white tracking-tight capitalize">
                    {selectedPlan} Plan
                  </h3>
                  <div className="text-right">
                    <span className="text-2xl font-extrabold text-white">${basePrice.toFixed(2)}</span>
                    <span className="text-xs text-neutral-400 block font-mono">
                      /{billingCycle === 'annual' ? 'year' : 'month'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                  {selectedPlan === 'Pro'
                    ? 'High-frequency pings & custom branding built for fast-moving tech teams.'
                    : 'Ultra-low latency check frequency for enterprise apps.'}
                </p>

                {/* Features Included List */}
                <ul className="mt-4 space-y-2 text-xs text-neutral-300">
                  {currentPlanObj.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-[#30ff87] shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Line items pricing breakdown */}
              <div className="space-y-2.5 text-xs font-mono text-neutral-400 border-b border-neutral-800 pb-6 mb-6">
                <div className="flex justify-between">
                  <span>Base Plan Price:</span>
                  <span className="text-white">${basePrice.toFixed(2)}</span>
                </div>
                {currentPlanPrice > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Current Plan Credit ({currentPlanType}):</span>
                    <span>-${currentPlanPrice.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Billing Cycle:</span>
                  <span className="text-white capitalize">{billingCycle}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-[#30ff87]">
                    <span>Discount ({appliedCoupon.code}):</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Estimated Tax:</span>
                  <span className="text-white">$0.00</span>
                </div>
              </div>

              {/* Total Due Row */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-neutral-400 block">PRORATED TOTAL DUE TODAY</span>
                  <span className="text-xs text-emerald-400 font-mono">Instant Upgrade · Cycle Resets</span>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-extrabold text-white tracking-tight">
                    ${finalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Security Guarantee Box */}
            <div className="vercel-card rounded-2xl p-5 bg-neutral-950/60 border border-neutral-800 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#30ff87]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">14-Day Money Back Guarantee</h4>
                  <p className="text-[11px] text-neutral-400">Cancel anytime from your billing dashboard with 1 click.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Success Confirmation Modal */}
      {successResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="max-w-md w-full rounded-2xl bg-neutral-950 border border-neutral-800 overflow-hidden">
            <div className="h-1 w-full bg-[#30ff87]" />
            <div className="p-8 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-[#30ff87]">
                <CheckCircle2 className="h-6 w-6" />
              </div>

              <p className="text-[11px] font-mono text-neutral-500 uppercase tracking-[0.2em] mt-5">
                Upgrade Complete
              </p>
              <h2 className="text-2xl font-bold text-white tracking-tight mt-1.5">Payment Authorized</h2>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                Your{' '}
                <span className="text-white font-semibold capitalize">{successResult.planType} Plan</span> is
                active. The prorated charge has been applied and your billing cycle has been reset.
              </p>

              <div className="my-6 rounded-xl bg-neutral-900/60 p-4 text-left space-y-2.5 border border-neutral-800 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Plan Tier:</span>
                  <span className="text-white capitalize">{successResult.planType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Billing Cycle:</span>
                  <span className="text-white capitalize">{successResult.billingCycle ?? billingCycle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Amount Charged:</span>
                  <span className="text-white">${successResult.amountPaid?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2.5 border-t border-neutral-800">
                  <span className="text-neutral-500">Transaction ID:</span>
                  <span className="text-[#30ff87]">{successResult.transactionId}</span>
                </div>
              </div>

              <button
                onClick={() => router.push('/dashboard/billing')}
                className="w-full rounded-xl bg-[#30ff87] text-black py-3 text-sm font-bold tracking-tight hover:bg-emerald-400 transition cursor-pointer"
              >
                Go to Billing Dashboard
              </button>
              <p className="text-[10px] text-neutral-500 mt-3">
                A confirmation email has been sent to {email || 'your email'}.
              </p>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center text-xs">
          Loading checkout...
        </div>
      }
    >
      <Elements
        stripe={stripePromise}
        options={{
          appearance: {
            theme: 'night',
            variables: {
              colorPrimary: '#30ff87',
              colorBackground: '#171717',
              colorText: '#ffffff',
              colorDanger: '#f87171',
              borderRadius: '8px',
            },
          },
        }}
      >
        <CheckoutContent />
      </Elements>
    </Suspense>
  );
}
