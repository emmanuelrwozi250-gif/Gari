import Link from 'next/link';
import { Car, MapPin, Phone, Mail, Twitter, Instagram } from 'lucide-react';
import { DISTRICTS_BY_PROVINCE } from '@/lib/districts';
import { COMPANY } from '@/lib/config/company';

export function Footer() {
  return (
    <footer className="bg-dark-bg text-gray-400 pt-16 pb-8 hidden md:block">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Car className="w-6 h-6 text-primary" />
              <span className="text-2xl font-bold text-white">
                Gar<span className="text-accent-yellow">i</span>
                <span className="text-primary text-sm">•</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed mb-6 max-w-xs">
              Rwanda&apos;s car rental marketplace. Verified hosts, mobile money payments, available across all 30 districts.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                <span>{COMPANY.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                <span>{COMPANY.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                <span>{COMPANY.email}</span>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <a href={COMPANY.twitter} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-white/10 hover:bg-primary/20 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href={COMPANY.instagram} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-white/10 hover:bg-primary/20 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/search" className="hover:text-primary transition-colors">Browse Cars</Link></li>
              <li><Link href="/safari" className="hover:text-primary transition-colors">🏕️ Safari</Link></li>
              <li><Link href="/airport-transfer" className="hover:text-primary transition-colors">✈️ Airport Transfer</Link></li>
              <li><Link href="/dashboard" className="hover:text-primary transition-colors">My Bookings</Link></li>
              <li><Link href="/dashboard/host" className="hover:text-primary transition-colors">Host Dashboard</Link></li>
            </ul>
          </div>

          {/* For Visitors */}
          <div>
            <h4 className="text-white font-semibold mb-4">For Visitors</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/international" className="hover:text-primary transition-colors">🌍 International Guide</Link></li>
              <li><Link href="/international#driving" className="hover:text-primary transition-colors">Driving Permit (IDP)</Link></li>
              <li><Link href="/airport-transfer" className="hover:text-primary transition-colors">Airport Transfers</Link></li>
              <li><Link href="/register?intent=foreign" className="hover:text-primary transition-colors">Register as Visitor</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/faq" className="hover:text-primary transition-colors">Help Center</Link></li>
              <li><Link href="/safety" className="hover:text-primary transition-colors">Safety</Link></li>
              <li><Link href="/insurance" className="hover:text-primary transition-colors">Insurance</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/press" className="hover:text-primary transition-colors">Press</Link></li>
            </ul>
          </div>

          {/* Districts */}
          <div>
            <h4 className="text-white font-semibold mb-4">Locations</h4>
            <ul className="space-y-1 text-sm">
              {/* Kigali districts */}
              {Object.entries(DISTRICTS_BY_PROVINCE).slice(0, 1).flatMap(([, districts]) =>
                districts.map(d => (
                  <li key={d.id}>
                    <Link href={`/search?district=${d.id}`} className="hover:text-primary transition-colors">
                      {d.name}
                    </Link>
                  </li>
                ))
              )}
              {/* High-intent upcountry destinations */}
              <li>
                <Link href="/search?district=MUSANZE" className="hover:text-primary transition-colors">
                  Musanze — Volcanoes
                </Link>
              </li>
              <li>
                <Link href="/search?district=RUBAVU" className="hover:text-primary transition-colors">
                  Rubavu — Lake Kivu
                </Link>
              </li>
              {/* Province browse links */}
              {Object.entries(DISTRICTS_BY_PROVINCE).slice(1).map(([province, districts]) => (
                <li key={province}>
                  <Link href={`/search?province=${province.replace(' ', '+')}`} className="hover:text-primary transition-colors">
                    {province.replace(' Province', '')} →
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <p>© {new Date().getFullYear()} Gari Technologies Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span>MTN MoMo</span>
            </span>
            <span>•</span>
            <span>Airtel Money</span>
            <span>•</span>
            <span>Visa / Mastercard</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
