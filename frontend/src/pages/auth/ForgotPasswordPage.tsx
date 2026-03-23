import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Compass, Home } from "lucide-react";
import { Button, Input } from "../../components/ui";
import authService from "../../services/auth.service";
import toast from "react-hot-toast";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }

    try {
      setLoading(true);
      await authService.forgotPassword(email);
      toast.success("If account exists, reset link has been sent");
    } catch (error: any) {
      toast.error(error?.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all"
        >
          <Home className="w-4 h-4" />
          <span className="font-medium">Back to Home</span>
        </Link>

        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Compass className="h-8 w-8 text-primary-500" />
            <span className="text-2xl font-bold text-gray-900">
              Tour<span className="text-primary-500">KZ</span>
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Forgot password</h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email and we will send reset instructions.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-5 h-5" />}
            placeholder="you@example.com"
            disabled={loading}
          />
          <Button type="submit" fullWidth isLoading={loading}>
            Send reset link
          </Button>
        </form>

        <p className="text-sm text-center text-gray-600">
          Back to{" "}
          <Link className="text-primary-600 hover:text-primary-500" to="/login">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

