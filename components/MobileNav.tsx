'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Car, Tag, TrendingUp, User, Map } from 'lucide-react';

const navItems = [
  { href: '/search', icon: Car, label: 'Rent' },
  { href: '/buy', icon: Tag, label: 'Buy' },
  { href: '/map', icon: Map, label: 'Map' },
  { href: '/earn', icon: TrendingUp, label: 'Earn' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-border shadow-lg">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors min-w-[44px] ${
                active ? 'text-primary' : 'text-text-light'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
              <span className={`text-xs font-medium ${active ? 'text-primary' : 'text-text-light'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
