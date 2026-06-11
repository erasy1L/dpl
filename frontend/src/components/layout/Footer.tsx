import { Link } from "react-router-dom";
import { Compass, Mail, Phone, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { useLocale } from "../../contexts/LocaleContext";
import * as m from "../../paraglide/messages.js";

const Footer = () => {
  useLocale();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* About Column */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Compass className="h-8 w-8 text-primary-400" />
              <span className="text-xl font-bold">
                Tour<span className="text-primary-400">KZ</span>
              </span>
            </div>
            <p className="text-gray-400 mb-4 leading-relaxed">
              {m.footer_tagline()}
            </p>
            <div className="flex gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-800 hover:bg-primary-600 rounded-lg transition-colors"
                aria-label={m.aria_facebook()}
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-800 hover:bg-primary-600 rounded-lg transition-colors"
                aria-label={m.aria_twitter()}
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-800 hover:bg-primary-600 rounded-lg transition-colors"
                aria-label={m.aria_instagram()}
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-800 hover:bg-primary-600 rounded-lg transition-colors"
                aria-label={m.aria_linkedin()}
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links Column */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{m.footer_quick_links()}</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/attractions"
                  className="text-gray-400 hover:text-primary-400 transition-colors"
                >
                  {m.footer_explore_attractions()}
                </Link>
              </li>
              <li>
                <Link
                  to="/categories"
                  className="text-gray-400 hover:text-primary-400 transition-colors"
                >
                  {m.footer_categories()}
                </Link>
              </li>
              <li>
                <Link
                  to="/popular"
                  className="text-gray-400 hover:text-primary-400 transition-colors"
                >
                  {m.footer_popular_destinations()}
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-gray-400 hover:text-primary-400 transition-colors"
                >
                  {m.footer_about_us()}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{m.footer_contact()}</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary-400 mt-0.5" />
                <div>
                  <p className="text-gray-400">{m.footer_email()}</p>
                  <a
                    href="mailto:support@tourkz.com"
                    className="text-white hover:text-primary-400 transition-colors"
                  >
                    support@tourkz.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-primary-400 mt-0.5" />
                <div>
                  <p className="text-gray-400">{m.footer_support()}</p>
                  <a
                    href="tel:+77001234567"
                    className="text-white hover:text-primary-400 transition-colors"
                  >
                    +7 (700) 123-45-67
                  </a>
                </div>
              </li>
            </ul>
            <div className="mt-4 space-y-2">
              <Link
                to="/terms"
                className="block text-gray-400 hover:text-primary-400 transition-colors"
              >
                {m.footer_terms()}
              </Link>
              <Link
                to="/privacy"
                className="block text-gray-400 hover:text-primary-400 transition-colors"
              >
                {m.footer_privacy()}
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm text-center md:text-left">
              {m.footer_copyright({ year: currentYear })}
            </p>
            <p className="text-gray-500 text-sm text-center md:text-right">
              {m.footer_diploma_note()}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
