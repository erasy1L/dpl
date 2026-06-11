import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MailCheck, Compass } from "lucide-react";
import { Button, Input } from "../../components/ui";
import { useLocale } from "../../contexts/LocaleContext";
import authService from "../../services/auth.service";
import toast from "react-hot-toast";
import * as m from "../../paraglide/messages.js";

const VerifyEmailPage = () => {
  useLocale();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    const tokenKey = `email-verify:${token}`;
    const alreadyVerified = sessionStorage.getItem(tokenKey) === "success";
    if (alreadyVerified) {
      setStatus("success");
      setLoading(false);
      return;
    }

    const run = async () => {
      try {
        setLoading(true);
        await authService.verifyEmail(token);
        sessionStorage.setItem(tokenKey, "success");
        setStatus("success");
        toast.success(m.toast_email_verified());
      } catch (error: any) {
        setStatus("error");
        toast.error(error?.message || m.toast_verification_failed());
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [token]);

  const resend = async () => {
    if (!email.trim()) {
      toast.error(m.toast_email_required());
      return;
    }
    try {
      setResendLoading(true);
      await authService.resendVerification(email);
      toast.success(m.toast_verification_sent());
    } catch (error: any) {
      toast.error(error?.message || m.toast_resend_failed());
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Compass className="h-8 w-8 text-primary-500" />
            <span className="text-2xl font-bold text-gray-900">
              Tour<span className="text-primary-500">KZ</span>
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {m.auth_verify_title()}
          </h1>
        </div>

        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          {loading && (
            <p className="text-gray-700">{m.auth_verifying()}</p>
          )}
          {!loading && status === "success" && (
            <div className="flex items-center gap-2 text-green-700">
              <MailCheck className="w-5 h-5" />
              <span>{m.auth_verify_success()}</span>
            </div>
          )}
          {!loading && status !== "success" && (
            <p className="text-gray-700">{m.auth_verify_invalid()}</p>
          )}
        </div>

        <div className="space-y-3">
          <Input
            label={m.auth_resend_label()}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={m.auth_email_placeholder()}
          />
          <Button onClick={resend} fullWidth isLoading={resendLoading}>
            {m.auth_resend_button()}
          </Button>
        </div>

        <p className="text-sm text-center text-gray-600">
          {m.auth_continue_to()}{" "}
          <Link className="text-primary-600 hover:text-primary-500" to="/login">
            {m.auth_sign_in_link()}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
