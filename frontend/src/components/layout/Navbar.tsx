import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  LogOut,
  Home,
  Compass,
  TrendingUp,
  Search,
  Menu,
  X,
  User,
  Star,
  Settings,
  BarChart3,
  Shield,
  Briefcase,
  Ticket,
} from "lucide-react";
import { useState } from "react";
import { Dropdown, Avatar } from "../ui";
import Modal from "../ui/Modal";

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

  const userMenuItems = [
    {
      label: "Profile",
      icon: <User className="w-4 h-4" />,
      onClick: () => navigate("/profile"),
    },
    {
      label: "My Ratings",
      icon: <Star className="w-4 h-4" />,
      onClick: () => navigate("/profile?tab=ratings"),
    },
    {
      label: "Preferences",
      icon: <Settings className="w-4 h-4" />,
      onClick: () => navigate("/profile?tab=preferences"),
    },
    {
      label: "Security",
      icon: <Shield className="w-4 h-4" />,
      onClick: () => navigate("/profile?tab=security"),
    },
    {
      label: "My bookings",
      icon: <Ticket className="w-4 h-4" />,
      onClick: () => navigate("/bookings"),
    },
    { divider: true },
    {
      label: "Logout",
      icon: <LogOut className="w-4 h-4" />,
      onClick: handleLogout,
    },
  ];

  return (
    <>
      <nav className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <Compass className="h-7 w-7 md:h-8 md:w-8 text-primary-500 group-hover:rotate-12 transition-transform duration-300" />
              <div className="flex flex-col">
                <span className="text-lg md:text-xl font-bold text-gray-900">
                  Tour<span className="text-primary-500">KZ</span>
                </span>
              </div>
            </Link>

            {/* Desktop Navigation — public browse + extra items when signed in */}
            <div className="hidden md:flex items-center gap-1">
              <NavLink to="/" icon={Home} label="Home" active={isActive("/")} />
              <NavLink
                to="/attractions"
                icon={Compass}
                label="Explore"
                active={location.pathname.startsWith("/attractions")}
              />
              <NavLink
                to="/tours"
                icon={Briefcase}
                label="Tours"
                active={location.pathname.startsWith("/tours")}
              />
              <NavLink
                to="/companies"
                icon={Briefcase}
                label="Companies"
                active={location.pathname.startsWith("/companies")}
              />
              {isAuthenticated && (
                <>
                  <NavLink
                    to="/recommendations"
                    icon={TrendingUp}
                    label="Recommendations"
                    active={isActive("/recommendations")}
                  />
                  <NavLink
                    to="/analytics"
                    icon={BarChart3}
                    label="Analytics"
                    active={isActive("/analytics")}
                  />
                  {(user?.role === "manager" || user?.role === "admin") && (
                    <NavLink
                      to="/admin"
                      icon={Shield}
                      label="Admin"
                      active={isActive("/admin")}
                    />
                  )}
                </>
              )}
            </div>

            {/* Right Side Actions */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  {/* Search Button */}
                  <button
                    onClick={() => setSearchOpen(!searchOpen)}
                    className="p-2 text-gray-600 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                    aria-label="Search"
                  >
                    <Search className="h-5 w-5" />
                  </button>

                  {/* User Menu */}
                  <Dropdown
                    trigger={
                      <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <Avatar
                          fallback={user?.name?.charAt(0) || "U"}
                          size="md"
                        />
                        <div className="hidden lg:block text-left">
                          <p className="text-sm font-medium text-gray-900">
                            {user?.name}
                          </p>
                          <p className="text-xs text-gray-500">{user?.email}</p>
                          {user?.role && (
                            <p className="text-xs text-primary-600 capitalize">
                              {user.role}
                            </p>
                          )}
                        </div>
                      </button>
                    }
                    items={userMenuItems}
                    align="right"
                  />
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-primary-500 font-medium transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-primary-500"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Search Modal */}
      <Modal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        title="Search Attractions"
        size="lg"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search attractions, cities, activities..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            autoFocus
          />
        </div>
        <p className="mt-4 text-sm text-gray-500">
          Try searching for "museums", "Almaty", "nature"...
        </p>
      </Modal>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50 animate-fadeIn" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="absolute right-0 top-0 h-full w-64 bg-white shadow-xl animate-slideInRight"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isAuthenticated ? (
              <div className="p-4 space-y-2">
                <MobileNavLink
                  to="/"
                  icon={Home}
                  label="Home"
                  onClick={() => setMobileMenuOpen(false)}
                />
                <MobileNavLink
                  to="/attractions"
                  icon={Compass}
                  label="Explore"
                  onClick={() => setMobileMenuOpen(false)}
                />
                <MobileNavLink
                  to="/tours"
                  icon={Briefcase}
                  label="Tours"
                  onClick={() => setMobileMenuOpen(false)}
                />
                <MobileNavLink
                  to="/companies"
                  icon={Briefcase}
                  label="Companies"
                  onClick={() => setMobileMenuOpen(false)}
                />
                <MobileNavLink
                  to="/recommendations"
                  icon={TrendingUp}
                  label="Recommendations"
                  onClick={() => setMobileMenuOpen(false)}
                />
                <MobileNavLink
                  to="/analytics"
                  icon={BarChart3}
                  label="Analytics"
                  onClick={() => setMobileMenuOpen(false)}
                />
                {(user?.role === "manager" || user?.role === "admin") && (
                  <MobileNavLink
                    to="/admin"
                    icon={Shield}
                    label="Admin"
                    onClick={() => setMobileMenuOpen(false)}
                  />
                )}
                <div className="border-t pt-2 mt-2">
                  <MobileNavLink
                    to="/profile"
                    icon={User}
                    label="Profile"
                    onClick={() => setMobileMenuOpen(false)}
                  />
                  <MobileNavLink
                    to="/profile?tab=ratings"
                    icon={Star}
                    label="My Ratings"
                    onClick={() => setMobileMenuOpen(false)}
                  />
                  <MobileNavLink
                    to="/bookings"
                    icon={Ticket}
                    label="My bookings"
                    onClick={() => setMobileMenuOpen(false)}
                  />
                  <MobileNavLink
                    to="/profile?tab=preferences"
                    icon={Settings}
                    label="Preferences"
                    onClick={() => setMobileMenuOpen(false)}
                  />
                  <MobileNavLink
                    to="/profile?tab=security"
                    icon={Shield}
                    label="Security"
                    onClick={() => setMobileMenuOpen(false)}
                  />
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                <MobileNavLink
                  to="/"
                  icon={Home}
                  label="Home"
                  onClick={() => setMobileMenuOpen(false)}
                />
                <MobileNavLink
                  to="/attractions"
                  icon={Compass}
                  label="Explore"
                  onClick={() => setMobileMenuOpen(false)}
                />
                <MobileNavLink
                  to="/tours"
                  icon={Briefcase}
                  label="Tours"
                  onClick={() => setMobileMenuOpen(false)}
                />
                <MobileNavLink
                  to="/companies"
                  icon={Briefcase}
                  label="Companies"
                  onClick={() => setMobileMenuOpen(false)}
                />
                <div className="border-t pt-3 mt-2 space-y-2">
                  <Link
                    to="/login"
                    className="block w-full text-center py-3 border border-primary-500 text-primary-500 rounded-lg font-medium hover:bg-primary-50 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block w-full text-center py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

// Helper Components
interface NavLinkProps {
  to: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
}

const NavLink = ({ to, icon: Icon, label, active }: NavLinkProps) => (
  <Link
    to={to}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
      active
        ? "text-primary-600 bg-primary-50 font-medium underline decoration-2 underline-offset-8"
        : "text-gray-700 hover:text-primary-600 hover:bg-gray-50"
    }`}
  >
    <Icon className="h-5 w-5" />
    <span>{label}</span>
  </Link>
);

interface MobileNavLinkProps {
  to: string;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}

const MobileNavLink = ({ to, icon: Icon, label, onClick }: MobileNavLinkProps) => (
  <Link
    to={to}
    onClick={onClick}
    className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
  >
    <Icon className="h-5 w-5" />
    <span className="font-medium">{label}</span>
  </Link>
);

export default Navbar;