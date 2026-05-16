'use client';

import { useLanguage, type Locale } from '@/lib/language';

const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'rw', label: 'Kinyarwanda', flag: '🇷🇼' },
];

export function LanguageToggle() {
  const { locale, setLocale } = useLanguage();

  const handleChange = (code: Locale) => {
    setLocale(code);
    // Persist to DB for logged-in users (fire-and-forget, non-blocking)
    fetch('/api/user/locale', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: code }),
    }).catch(() => {
      // Non-fatal — locale already saved to localStorage + cookie
    });
  };

  return (
    <div className="flex items-center gap-1">
      {LOCALES.map(({ code, label, flag }) => (
        <button
          key={code}
          onClick={() => handleChange(code)}
          title={label}
          className={`text-xs px-2 py-1 rounded-md transition-colors ${
            locale === code
              ? 'bg-gari-green text-white font-semibold'
              : 'text-text-secondary hover:text-text-primary hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <span className="mr-1">{flag}</span>
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
