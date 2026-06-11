import { FormEvent, useMemo, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Lock, Compass } from "lucide-react";
import { Button, Input } from "../../components/ui";
import { useLocale } from "../../contexts/LocaleContext";
import authService from "../../services/auth.service";
import toast from "react-hot-toast";
import * as m from "../../paraglide/messages.js";

const ResetPasswordPage = () => {
  useLocale();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error(m.toast_missing_reset_token());
      return;
    }
    if (password.length < 6) {
      toast.error(m.auth_error_password_min());
      return;
    }
    if (password !== confirmPassword) {
      toast.error(m.auth_error_passwords_mismatch());
      return;
    }

    try {
      setLoading(true);
      await authService.resetPassword(token, password);
      toast.success(m.toast_password_reset_success());
      navigate("/login");
    } catch (error: any) {
      toast.error(error?.message || m.toast_password_reset_failed());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Compass className="h-8 w-8 text-primary-500" />
            <span className="text-2xl font-bold text-gray-900">
              Tour<span className="text-primary-500">KZ</span>
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {m.auth_reset_title()}
          </h1>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label={m.auth_new_password_label()}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-5 h-5" />}
            disabled={loading}
          />
          <Input
            label={m.auth_confirm_password_label()}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            leftIcon={<Lock className="w-5 h-5" />}
            disabled={loading}
          />
          <Button type="submit" fullWidth isLoading={loading}>
            {m.auth_set_new_password()}
          </Button>
        </form>

        <p className="text-sm text-center text-gray-600">
          {m.auth_back_to_sign_in()}{" "}
          <Link className="text-primary-600 hover:text-primary-500" to="/login">
            {m.auth_sign_in_link()}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
