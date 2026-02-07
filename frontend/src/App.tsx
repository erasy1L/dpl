import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/layout/Layout";
import { LoginPage, RegisterPage } from "./pages/auth";
import { ExplorePage } from "./pages/explore";
import { HomePage } from "./pages/home";
import { AttractionDetailPage } from "./pages/attraction";
import { RecommendationsPage } from "./pages/recommendations";
import { AnalyticsDashboardPage } from "./pages/analytics";
import { ProfilePage } from "./pages/profile";

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

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
                <ProtectedRoute>
                  <Layout showFooter={false}>
                    <AttractionDetailPage />
                  </Layout>
                </ProtectedRoute>
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
          </Routes>
        </Router>
      </AuthProvider>
    </>
  );
}

export default App;
