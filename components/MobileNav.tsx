'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Car, TrendingUp, ClipboardList, User } from 'lucide-react';

const navItems = [
  { href: '/search', icon: Car, label: 'Find a Car' },
  { href: '/earn', icon: TrendingUp, label: 'Earn' },
  { href: '/dashboard', icon: ClipboardList, label: 'Trips' },
  { href: '/profile', icon: User, label: 'Me' },
];

export function MobileNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-border shadow-lg">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          const isProfile = href === '/profile';
          const requiresAuth = href === '/profile' || href === '/dashboard';
          return (
            <Link
              key={href}
              href={requiresAuth && !session ? '/login' : href}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors min-w-[44px] ${
                active ? 'text-primary' : 'text-text-light'
              }`}
            >
              {isProfile && session?.user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt=""
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
              )}
              <span className={`text-xs font-medium ${active ? 'text-primary' : 'text-text-light'}`}>
                {isProfile && !session ? 'Sign In' : label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
