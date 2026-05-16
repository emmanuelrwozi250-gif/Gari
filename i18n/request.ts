import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('GARI_LOCALE')?.value;
  const validLocales = ['en', 'fr'];
  const locale = validLocales.includes(cookieLocale ?? '') ? cookieLocale! : 'en';
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
