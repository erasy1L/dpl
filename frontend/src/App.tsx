import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/layout/Layout";
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  VerifyEmailPage,
} from "./pages/auth";
import { ExplorePage } from "./pages/explore";
import { HomePage } from "./pages/home";
import { AttractionDetailPage } from "./pages/attraction";
import { RecommendationsPage } from "./pages/recommendations";
import { AnalyticsDashboardPage } from "./pages/analytics";
import { ProfilePage } from "./pages/profile";
import { AdminPage } from "./pages/admin";
import ToursListPage from "./pages/tours/ToursListPage";
import TourDetailPage from "./pages/tours/TourDetailPage";
import CompaniesListPage from "./pages/companies/CompaniesListPage";
import CompanyDetailPage from "./pages/companies/CompanyDetailPage";
import BookingFlowPage from "./pages/bookings/BookingFlowPage";
import PayPalReturnPage from "./pages/bookings/PayPalReturnPage";
import PolarReturnPage from "./pages/bookings/PolarReturnPage";
import MyBookingsPage from "./pages/bookings/MyBookingsPage";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ChatProvider } from "./components/chat/ChatContext";
import ChatBubble from "./components/chat/ChatBubble";
import ChatPanel from "./components/chat/ChatPanel";

// Scroll to top component
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <AuthProvider>
        <Router>
          <ChatProvider>
            <ScrollToTop />
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />

              <Route
                path="/"
                element={
                  <Layout>
                    <HomePage />
                  </Layout>
                }
              />

              <Route
                path="/attractions"
                element={
                  <Layout>
                    <ExplorePage />
                  </Layout>
                }
              />

              <Route
                path="/attractions/:id"
                element={
                  <Layout showFooter={false}>
                    <AttractionDetailPage />
                  </Layout>
                }
              />

              <Route
                path="/recommendations"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <RecommendationsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/tours"
                element={
                  <Layout>
                    <ToursListPage />
                  </Layout>
                }
              />

              <Route
                path="/tours/:id"
                element={
                  <Layout>
                    <TourDetailPage />
                  </Layout>
                }
              />

              <Route
                path="/companies"
                element={
                  <Layout>
                    <CompaniesListPage />
                  </Layout>
                }
              />

              <Route
                path="/companies/:id"
                element={
                  <Layout>
                    <CompanyDetailPage />
                  </Layout>
                }
              />

              <Route
                path="/bookings/new"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <BookingFlowPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/bookings/payment/paypal-return"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <PayPalReturnPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/bookings/payment/polar-return"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <PolarReturnPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/bookings"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <MyBookingsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/analytics"
                element={
                  <Layout>
                    <AnalyticsDashboardPage />
                  </Layout>
                }
              />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ProfilePage />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={["manager", "admin"]}>
                    <Layout>
                      <AdminPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
            </Routes>
            <ChatBubble />
            <ChatPanel />
          </ChatProvider>
        </Router>
      </AuthProvider>
    </>
  );
}

export default App;
