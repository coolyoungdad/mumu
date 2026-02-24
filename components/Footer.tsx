"use client";

import { Sparkle, InstagramLogo, TiktokLogo, TwitterLogo } from "@phosphor-icons/react/dist/ssr";

const footerLinks = {
  discover: [
    { label: "All Boxes", href: "#" },
    { label: "Live Feed", href: "#" },
    { label: "Marketplace", href: "#" },
  ],
  support: [
    { label: "Odds Disclosure", href: "/legal/odds" },
    { label: "Terms of Service", href: "/legal/terms" },
    { label: "Privacy Policy", href: "/legal/privacy" },
  ],
};

const socialLinks = [
  { icon: InstagramLogo, href: "#", label: "Instagram" },
  { icon: TiktokLogo, href: "#", label: "TikTok" },
  { icon: TwitterLogo, href: "#", label: "Twitter" },
];

export default function Footer() {
  return (
    <footer className="bg-white pt-20 pb-10 border-t border-orange-100 relative z-10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16">
          <div className="max-w-xs">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-white">
                <Sparkle weight="fill" className="text-xl" />
              </div>
              <span className="font-bold text-2xl tracking-tight text-orange-950">
                Mumu
              </span>
            </div>
            <p className="text-gray-500 font-medium">
              The future of mystery shopping. Fair, transparent, and always fun.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
            <div>
              <h4 className="font-bold text-orange-950 mb-4">Discover</h4>
              <ul className="space-y-3 text-gray-500 font-medium">
                {footerLinks.discover.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="hover:text-orange-600">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-orange-950 mb-4">Support</h4>
              <ul className="space-y-3 text-gray-500 font-medium">
                {footerLinks.support.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="hover:text-orange-600">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-orange-950 mb-4">Social</h4>
              <div className="flex gap-4">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center hover:bg-orange-600 hover:text-white transition-colors"
                      aria-label={social.label}
                    >
                      <Icon weight="fill" className="text-xl" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400 font-medium">
          <p>© 2024 Mumu Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="/legal/privacy" className="hover:text-orange-600">
              Privacy
            </a>
            <a href="/legal/terms" className="hover:text-orange-600">
              Terms
            </a>
            <a href="/legal/odds" className="hover:text-orange-600">
              Odds
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
