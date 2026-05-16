'use client';

const LOCALES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
] as const;

type Locale = typeof LOCALES[number]['code'];

function getCurrentLocale(): Locale {
  if (typeof document === 'undefined') return 'en';
  const match = document.cookie.match(/GARI_LOCALE=([^;]+)/);
  const val = match?.[1];
  return (val === 'en' || val === 'fr') ? val : 'en';
}

export function LanguageToggle() {
  const currentLocale = getCurrentLocale();

  const handleChange = (code: Locale) => {
    document.cookie = `GARI_LOCALE=${code}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    fetch('/api/user/locale', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: code }),
    }).catch(() => {});
    window.location.reload();
  };

  return (
    <div className="flex items-center gap-1">
      {LOCALES.map(({ code, label, flag }) => (
        <button
          key={code}
          onClick={() => handleChange(code)}
          title={label}
          className={`text-xs px-2 py-1 rounded-md transition-colors ${
            currentLocale === code
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
