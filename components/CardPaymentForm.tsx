'use client';

import { useState, useCallback } from 'react';
import { CreditCard, Lock } from 'lucide-react';

/** Luhn algorithm — returns true if card number passes */
function luhn(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i], 10);
    if (shouldDouble) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

/** Format card number with spaces every 4 digits */
function formatCard(raw: string) {
  return raw.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

/** Detect card network from first digits */
function cardNetwork(digits: string): string {
  if (/^4/.test(digits)) return 'Visa';
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'Amex';
  return '';
}

export interface CardDetails {
  number: string;      // raw digits
  expiry: string;      // MM/YY
  cvv: string;
  holderName: string;
}

interface Props {
  onValid: (card: CardDetails) => void;
  onInvalid: () => void;
  totalUSD: number;
}

export function CardPaymentForm({ onValid, onInvalid, totalUSD }: Props) {
  const [number, setNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [holderName, setHolderName] = useState('');
  const [touched, setTouched] = useState({ number: false, expiry: false, cvv: false, holderName: false });

  const rawDigits = number.replace(/\D/g, '');
  const network = cardNetwork(rawDigits);
  const numberValid = luhn(rawDigits);

  const expiryValid = (() => {
    const [mm, yy] = expiry.split('/');
    if (!mm || !yy || mm.length !== 2 || yy.length !== 2) return false;
    const month = parseInt(mm, 10);
    const year = parseInt(`20${yy}`, 10);
    if (month < 1 || month > 12) return false;
    const now = new Date();
    return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
  })();

  const cvvValid = cvv.length >= 3;
  const nameValid = holderName.trim().length >= 2;
  const allValid = numberValid && expiryValid && cvvValid && nameValid;

  const notify = useCallback(() => {
    if (allValid) {
      onValid({ number: rawDigits, expiry, cvv, holderName: holderName.trim() });
    } else {
      onInvalid();
    }
  }, [allValid, rawDigits, expiry, cvv, holderName, onValid, onInvalid]);

  function handleNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatCard(e.target.value);
    setNumber(formatted);
  }

  function handleExpiryChange(e: React.ChangeEvent<HTMLInputElement>) {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 3) val = val.slice(0, 2) + '/' + val.slice(2);
    setExpiry(val);
  }

  const field = (key: keyof typeof touched) => ({
    onBlur: () => { setTouched(t => ({ ...t, [key]: true })); notify(); },
  });

  const errClass = (valid: boolean, touch: boolean) =>
    touch && !valid ? 'border-red-400 focus:ring-red-300' : '';

  return (
    <div className="mt-3 rounded-xl border border-border bg-gray-50 dark:bg-gray-800/60 p-4 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
          <Lock className="w-3.5 h-3.5" /> Secure card payment
        </div>
        {network && (
          <span className="text-xs font-bold text-text-secondary bg-white dark:bg-gray-700 px-2 py-0.5 rounded-md border border-border">
            {network}
          </span>
        )}
      </div>

      {/* Card number */}
      <div>
        <label className="text-xs text-text-light mb-1 block">Card number</label>
        <div className="relative">
          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light pointer-events-none" />
          <input
            type="text"
            inputMode="numeric"
            value={number}
            onChange={handleNumberChange}
            placeholder="1234 5678 9012 3456"
            maxLength={19}
            className={`input pl-9 w-full font-mono ${errClass(numberValid, touched.number)}`}
            {...field('number')}
          />
        </div>
        {touched.number && !numberValid && rawDigits.length > 0 && (
          <p className="text-xs text-red-500 mt-0.5">Invalid card number</p>
        )}
      </div>

      {/* Cardholder name */}
      <div>
        <label className="text-xs text-text-light mb-1 block">Cardholder name</label>
        <input
          type="text"
          value={holderName}
          onChange={e => setHolderName(e.target.value)}
          placeholder="As printed on card"
          className={`input w-full ${errClass(nameValid, touched.holderName)}`}
          {...field('holderName')}
        />
      </div>

      {/* Expiry + CVV */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-text-light mb-1 block">Expiry (MM/YY)</label>
          <input
            type="text"
            inputMode="numeric"
            value={expiry}
            onChange={handleExpiryChange}
            placeholder="MM/YY"
            maxLength={5}
            className={`input w-full font-mono ${errClass(expiryValid, touched.expiry)}`}
            {...field('expiry')}
          />
        </div>
        <div>
          <label className="text-xs text-text-light mb-1 block">CVV</label>
          <input
            type="password"
            inputMode="numeric"
            value={cvv}
            onChange={e => { setCvv(e.target.value.replace(/\D/g, '').slice(0, 4)); }}
            placeholder="•••"
            maxLength={4}
            className={`input w-full font-mono ${errClass(cvvValid, touched.cvv)}`}
            {...field('cvv')}
          />
        </div>
      </div>

      {/* USD total note */}
      <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 px-3 py-2 text-xs text-blue-700 dark:text-blue-300">
        💳 Your card will be charged approximately{' '}
        <strong>${totalUSD.toLocaleString()} USD</strong>.{' '}
        Final amount may vary slightly with your bank's exchange rate.
      </div>
    </div>
  );
}
