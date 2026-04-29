import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Container from "../../components/layout/Container";
import { Button } from "../../components/ui";
import bookingService from "../../services/booking.service";
import toast from "react-hot-toast";

const PayPalReturnPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const once = useRef(false);

  useEffect(() => {
    if (once.current) return;
    once.current = true;

    const token = searchParams.get("token");
    if (!token) {
      setErrMsg("Missing payment token. Return to your booking and try again.");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        await bookingService.capturePayPal(token);
        toast.success("Payment completed");
        navigate("/bookings", { replace: true });
      } catch (e: unknown) {
        const msg =
          e && typeof e === "object" && "message" in e
            ? String((e as { message: string }).message)
            : "Payment could not be completed";
        setErrMsg(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate, searchParams]);

  if (errMsg) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-gray-50">
        <Container size="md" className="text-center py-16 space-y-4">
          <p className="text-red-700">{errMsg}</p>
          <Button variant="primary" onClick={() => navigate("/bookings")}>
            My bookings
          </Button>
        </Container>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-gray-50">
        <Container size="md" className="text-center py-16">
          <p className="text-gray-700">Completing your PayPal payment…</p>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-[50vh] flex items-center justify-center bg-gray-50">
      <Container size="md" className="text-center py-16">
        <p className="text-gray-700">Redirecting…</p>
      </Container>
    </div>
  );
};

export default PayPalReturnPage;
