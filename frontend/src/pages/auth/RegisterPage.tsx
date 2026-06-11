import { useState, FormEvent, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useLocale } from "../../contexts/LocaleContext";
import { Mail, Lock, User, Compass, CheckCircle2, Home } from "lucide-react";
import { Input, Button } from "../../components/ui";
import toast from "react-hot-toast";
import { cn } from "../../utils/cn";
import * as m from "../../paraglide/messages.js";

type PasswordStrength = "weak" | "medium" | "strong";

const RegisterPage = () => {
  useLocale();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
  }>({});

  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  // Calculate password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength(null);
      return;
    }

    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);

    if (password.length < 8) {
      setPasswordStrength("weak");
    } else if (
      password.length >= 8 &&
      hasNumbers &&
      (hasUpperCase || hasLowerCase)
    ) {
      if (hasSpecialChars && hasUpperCase && hasLowerCase) {
        setPasswordStrength("strong");
      } else {
        setPasswordStrength("medium");
      }
    } else {
      setPasswordStrength("weak");
    }
  }, [password]);

  const getPasswordStrengthLabel = () => {
    if (!passwordStrength) return "";
    if (passwordStrength === "weak") return m.auth_password_weak();
    if (passwordStrength === "medium") return m.auth_password_medium();
    return m.auth_password_strong();
  };

  const validateForm = () => {
    const newErrors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
      terms?: string;
    } = {};

    if (!name) {
      newErrors.name = m.auth_error_name_required();
    } else if (name.length < 2) {
      newErrors.name = m.auth_error_name_min();
    }

    if (!email) {
      newErrors.email = m.auth_error_email_required();
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = m.auth_error_email_invalid();
    }

    if (!password) {
      newErrors.password = m.auth_error_password_required();
    } else if (password.length < 6) {
      newErrors.password = m.auth_error_password_min();
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = m.auth_error_confirm_required();
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = m.auth_error_passwords_mismatch();
    }

    if (!agreeTerms) {
      newErrors.terms = m.auth_error_terms_required();
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
      await register({ name, email, password });
      toast.success(m.toast_account_created());
      navigate("/login");
    } catch (err: any) {
      toast.error(err.message || m.toast_registration_failed());
    }
  };

  const getPasswordStrengthColor = () => {
    if (!passwordStrength) return "bg-gray-200";
    if (passwordStrength === "weak") return "bg-red-500";
    if (passwordStrength === "medium") return "bg-amber-500";
    return "bg-green-500";
  };

  const getPasswordStrengthWidth = () => {
    if (!passwordStrength) return "w-0";
    if (passwordStrength === "weak") return "w-1/3";
    if (passwordStrength === "medium") return "w-2/3";
    return "w-full";
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
              {m.auth_create_account()}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {m.auth_register_subtitle()}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <Input
              label={m.auth_full_name_label()}
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrors({ ...errors, name: undefined });
              }}
              error={errors.name}
              leftIcon={<User className="w-5 h-5" />}
              placeholder={m.auth_full_name_placeholder()}
              disabled={isLoading}
            />

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

            <div>
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
              {password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">
                      {m.auth_password_strength()}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-medium",
                        passwordStrength === "weak" && "text-red-600",
                        passwordStrength === "medium" && "text-amber-600",
                        passwordStrength === "strong" && "text-green-600"
                      )}
                    >
                      {getPasswordStrengthLabel()}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all duration-300",
                        getPasswordStrengthColor(),
                        getPasswordStrengthWidth()
                      )}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {m.auth_password_hint()}
                  </p>
                </div>
              )}
            </div>

            <Input
              label={m.auth_confirm_password_label()}
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrors({ ...errors, confirmPassword: undefined });
              }}
              error={errors.confirmPassword}
              leftIcon={<Lock className="w-5 h-5" />}
              placeholder={m.auth_password_placeholder()}
              disabled={isLoading}
            />

            <div>
              <div className="flex items-start">
                <input
                  id="terms"
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => {
                    setAgreeTerms(e.target.checked);
                    setErrors({ ...errors, terms: undefined });
                  }}
                  className="h-4 w-4 mt-0.5 text-primary-500 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                  {m.auth_agree_terms_prefix()}{" "}
                  <Link
                    to="/terms"
                    className="text-primary-600 hover:text-primary-500 font-medium"
                  >
                    {m.auth_terms_of_service()}
                  </Link>{" "}
                  {m.auth_and()}{" "}
                  <Link
                    to="/privacy"
                    className="text-primary-600 hover:text-primary-500 font-medium"
                  >
                    {m.auth_privacy_policy()}
                  </Link>
                </label>
              </div>
              {errors.terms && (
                <p className="mt-1 text-sm text-red-600">{errors.terms}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg hover:shadow-xl transition-all"
            >
              {isLoading
                ? m.auth_creating_account()
                : m.auth_create_account_button()}
            </Button>

            <p className="text-xs text-center text-gray-500 mt-2">
              {m.auth_create_hint()}
            </p>
          </form>

          {/* Sign In Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              {m.auth_have_account()}{" "}
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                {m.auth_sign_in_link()}
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
              "url('https://images.pexels.com/photos/33452166/pexels-photo-33452166.jpeg')",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary-900/80 to-secondary-900/80" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <h1 className="text-4xl font-bold mb-4">
            {m.auth_hero_register_title()}
          </h1>
          <p className="text-xl text-white/90 mb-8">
            {m.auth_hero_register_subtitle()}
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold">{m.auth_feature_guides_title()}</h3>
                <p className="text-sm text-white/80">
                  {m.auth_feature_guides_desc()}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold">{m.auth_feature_favorites_title()}</h3>
                <p className="text-sm text-white/80">
                  {m.auth_feature_favorites_desc()}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold">{m.auth_feature_connect_title()}</h3>
                <p className="text-sm text-white/80">
                  {m.auth_feature_connect_desc()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
