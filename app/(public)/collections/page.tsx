import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { CollectionCard } from '@/components/CollectionCard';
import { COLLECTIONS } from '@/lib/collections';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations('seo');
  return {
    title: t('collectionsTitle'),
    description: t('collectionsDesc'),
    openGraph: {
      title: t('collectionsTitle'),
      description: t('collectionsDesc'),
      url: 'https://gari-africa.com/collections',
      siteName: 'Gari',
      locale: locale === 'fr' ? 'fr_RW' : 'en_RW',
      type: 'website',
    },
  };
}

export default function CollectionsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-text-primary dark:text-white mb-3">
          Browse Packages
        </h1>
        <p className="text-text-secondary dark:text-gray-400 max-w-xl mx-auto">
          Whether you're tracking gorillas, heading to Lake Kivu, or attending a board meeting —
          we've curated the right car for every Rwanda journey.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {COLLECTIONS.map((collection) => (
          <CollectionCard key={collection.slug} collection={collection} />
        ))}
      </div>
    </div>
  );
}
