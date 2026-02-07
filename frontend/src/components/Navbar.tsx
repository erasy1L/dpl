// frontend/src/components/Navbar.tsx
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  LogOut,
  Home,
  Compass,
  Heart,
  TrendingUp,
  Search,
  Bell,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <Compass className="h-8 w-8 text-primary-500 group-hover:rotate-12 transition-transform duration-300" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-secondary-500 rounded-full animate-pulse"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-900 tracking-tight">
                Tourism<span className="text-primary-500">KZ</span>
              </span>
              <span className="text-xs text-gray-500 -mt-1">
                Discover Kazakhstan
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center space-x-1">
              <NavLink to="/" icon={Home} label="Home" active={isActive("/")} />
              <NavLink
                to="/attractions"
                icon={Compass}
                label="Explore"
                active={isActive("/attractions")}
              />
              <NavLink
                to="/recommendations"
                icon={TrendingUp}
                label="For You"
                active={isActive("/recommendations")}
              />
              <NavLink
                to="/favorites"
                icon={Heart}
                label="Saved"
                active={isActive("/favorites")}
              />
            </div>
          )}

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Search Button */}
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
                >
                  <Search className="h-5 w-5" />
                </button>

                {/* Notifications */}
                <button className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                {/* User Menu */}
                <div className="flex items-center space-x-3 pl-4 border-l">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-semibold">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden lg:block">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.name}
                      </p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-600 hover:text-error hover:bg-red-50 rounded-lg transition"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-primary-600 font-medium transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-primary-500 to-primary-700 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg hover:scale-105 transition-all duration-200"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-primary-600"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Search Bar (Expandable) */}
        {searchOpen && (
          <div className="py-4 border-t border-gray-100 animate-fadeIn">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search attractions, cities, activities..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                autoFocus
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && isAuthenticated && (
        <div className="md:hidden border-t border-gray-100 bg-white animate-slideDown">
          <div className="px-4 py-4 space-y-2">
            <MobileNavLink to="/" icon={Home} label="Home" />
            <MobileNavLink to="/attractions" icon={Compass} label="Explore" />
            <MobileNavLink
              to="/recommendations"
              icon={TrendingUp}
              label="For You"
            />
            <MobileNavLink to="/favorites" icon={Heart} label="Saved" />
          </div>
        </div>
      )}
    </nav>
  );
};

// Helper Components
const NavLink = ({ to, icon: Icon, label, active }: any) => (
  <Link
    to={to}
    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
      active
        ? "bg-primary-50 text-primary-600 font-medium"
        : "text-gray-700 hover:bg-gray-50 hover:text-primary-600"
    }`}
  >
    <Icon className="h-5 w-5" />
    <span>{label}</span>
  </Link>
);

const MobileNavLink = ({ to, icon: Icon, label }: any) => (
  <Link
    to={to}
    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition"
  >
    <Icon className="h-5 w-5" />
    <span className="font-medium">{label}</span>
  </Link>
);

export default Navbar;
