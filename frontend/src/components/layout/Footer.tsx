import { Link } from "react-router-dom";
import { Compass, Mail, Phone, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

const Footer = () => {
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
              Discover the best tourism destinations across Kazakhstan. Your guide to
              exploring cultural heritage, natural wonders, and modern attractions.
            </p>
            <div className="flex gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-800 hover:bg-primary-600 rounded-lg transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-800 hover:bg-primary-600 rounded-lg transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-800 hover:bg-primary-600 rounded-lg transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-800 hover:bg-primary-600 rounded-lg transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links Column */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/attractions"
                  className="text-gray-400 hover:text-primary-400 transition-colors"
                >
                  Explore Attractions
                </Link>
              </li>
              <li>
                <Link
                  to="/categories"
                  className="text-gray-400 hover:text-primary-400 transition-colors"
                >
                  Categories
                </Link>
              </li>
              <li>
                <Link
                  to="/popular"
                  className="text-gray-400 hover:text-primary-400 transition-colors"
                >
                  Popular Destinations
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-gray-400 hover:text-primary-400 transition-colors"
                >
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary-400 mt-0.5" />
                <div>
                  <p className="text-gray-400">Email</p>
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
                  <p className="text-gray-400">Support</p>
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
                Terms of Service
              </Link>
              <Link
                to="/privacy"
                className="block text-gray-400 hover:text-primary-400 transition-colors"
              >
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm text-center md:text-left">
              © {currentYear} TourKZ. All rights reserved.
            </p>
            <p className="text-gray-500 text-sm text-center md:text-right">
              Diploma Project - Information Systems
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;