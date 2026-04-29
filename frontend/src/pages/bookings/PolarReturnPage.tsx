import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Container from "../../components/layout/Container";
import { Button } from "../../components/ui";
import bookingService from "../../services/booking.service";
import toast from "react-hot-toast";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const PolarReturnPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const once = useRef(false);

  useEffect(() => {
    if (once.current) return;
    once.current = true;

    const checkoutId = searchParams.get("checkout_id");
    if (!checkoutId) {
      setErrMsg("Missing checkout. Return to your booking and try again.");
      setLoading(false);
      return;
    }

    (async () => {
      const maxAttempts = 10;
      let lastError: string = "";
      for (let i = 0; i < maxAttempts; i++) {
        try {
          await bookingService.syncPolarAfterReturn(checkoutId);
          toast.success("Payment confirmed");
          navigate("/bookings", { replace: true });
          return;
        } catch (e: unknown) {
          lastError =
            e && typeof e === "object" && "message" in e
              ? String((e as { message: string }).message)
              : String(e);
          const retry =
            lastError.includes("not found for checkout yet") && i < maxAttempts - 1;
          if (retry) {
            await wait(1500);
            continue;
          }
          if (i < maxAttempts - 1) {
            await wait(1500);
            continue;
          }
        }
      }
      setErrMsg(lastError || "Could not confirm payment");
      toast.error(lastError || "Could not confirm payment");
      setLoading(false);
    })();
  }, [navigate, searchParams]);

  if (errMsg) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-gray-50">
        <Container size="md" className="text-center py-16 space-y-4">
          <p className="text-red-700">{errMsg}</p>
          <p className="text-sm text-gray-600">
            If you were charged, the webhook may still update your booking—check
            My bookings in a minute.
          </p>
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
          <p className="text-gray-700">Confirming your Polar payment…</p>
        </Container>
      </div>
    );
  }

  return null;
};

export default PolarReturnPage;
