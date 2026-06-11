import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useLocale } from "../../contexts/LocaleContext";
import { Mail, Lock, Compass, CheckCircle2, Home } from "lucide-react";
import { Input, Button } from "../../components/ui";
import toast from "react-hot-toast";
import * as m from "../../paraglide/messages.js";

const LoginPage = () => {
  useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );

  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = m.auth_error_email_required();
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = m.auth_error_email_invalid();
    }

    if (!password) {
      newErrors.password = m.auth_error_password_required();
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await login({ email, password });
      toast.success(m.toast_welcome_back());
      navigate("/attractions");
    } catch (err: any) {
      toast.error(err.message || m.toast_login_failed());
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Back to Home Link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 transition-all mb-6"
          >
            <Home className="w-4 h-4" />
            <span className="font-medium">{m.auth_back_to_home()}</span>
          </Link>

          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <Compass className="h-10 w-10 text-primary-500" />
            <span className="text-2xl font-bold text-gray-900">
              Tour<span className="text-primary-500">KZ</span>
            </span>
          </div>

          {/* Header */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              {m.auth_welcome_back()}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {m.auth_sign_in_subtitle()}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4">
              <Input
                label={m.auth_email_label()}
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors({ ...errors, email: undefined });
                }}
                error={errors.email}
                leftIcon={<Mail className="w-5 h-5" />}
                placeholder={m.auth_email_placeholder()}
                disabled={isLoading}
              />

              <Input
                label={m.auth_password_label()}
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors({ ...errors, password: undefined });
                }}
                error={errors.password}
                leftIcon={<Lock className="w-5 h-5" />}
                placeholder={m.auth_password_placeholder()}
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-700"
                >
                  {m.auth_remember_me()}
                </label>
              </div>

              <Link
                to="/forgot-password"
                className="text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                {m.auth_forgot_password()}
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              className="bg-linear-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg hover:shadow-xl transition-all"
            >
              {isLoading ? m.auth_signing_in() : m.auth_sign_in_button()}
            </Button>

            <p className="text-xs text-center text-gray-500 mt-2">
              {m.auth_enter_hint()}
            </p>
          </form>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              {m.auth_no_account()}{" "}
              <Link
                to="/register"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                {m.auth_sign_up_link()}
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Hero Image (Hidden on mobile) */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-primary-500 to-secondary-500">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.pexels.com/photos/34293571/pexels-photo-34293571.jpeg')",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary-900/80 to-secondary-900/80" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <h1 className="text-4xl font-bold mb-4">
            {m.auth_hero_login_title()}
          </h1>
          <p className="text-xl text-white/90 mb-8">
            {m.auth_hero_login_subtitle()}
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold">{m.auth_feature_recommendations_title()}</h3>
                <p className="text-sm text-white/80">
                  {m.auth_feature_recommendations_desc()}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold">{m.auth_feature_info_title()}</h3>
                <p className="text-sm text-white/80">
                  {m.auth_feature_info_desc()}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold">{m.auth_feature_reviews_title()}</h3>
                <p className="text-sm text-white/80">
                  {m.auth_feature_reviews_desc()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
