import { lazy, Suspense, useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { AppLoader } from "@/components/Apploader";
import { ChatWidget } from "@/components/ChatWidget";
import { ToastContainer } from "@/components/ToastContainer";
import { AuthProvider } from "@/components/auth/AuthProvider";
import SettingsPage from "@/pages/SettingsPage";
import HelpPage from "@/pages/HelpPage";

const HomePage = lazy(() => import("@/pages/HomePage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const CartPage = lazy(() => import("@/pages/CartPage"));
const CheckoutPage = lazy(() => import("@/pages/CheckoutPage"));
const MessagePage = lazy(() => import("@/pages/MessagePage"));
const SignInPage = lazy(() => import("@/pages/Signinpage"));
const SignUpPage = lazy(() => import("@/pages/Signuppage"));
const CategoryPage = lazy(() => import("@/pages/CategoryPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

const PaymentSuccessPage = lazy(() => import("@/pages/Paymentsuccesspage"));

const RequireAuth = lazy(() =>
  import("@/components/auth/RequireAuth").then((mod) => ({
    default: mod.RequireAuth,
  })),
);

const AdminLoginPage = lazy(() => import("@/admin/AdminLoginPage"));
const AdminLayout = lazy(() => import("@/admin/AdminLayout"));
const RequireAdminAuth = lazy(() =>
  import("@/admin/RequireAdminAuth").then((mod) => ({
    default: mod.RequireAdminAuth,
  })),
);
const AdminAccountPage = lazy(() => import("@/admin/AdminAccountPage"));
const AdminOrderPage = lazy(() => import("@/admin/AdminOrderPage"));
const AdminChatPage = lazy(() => import("@/admin/AdminChatPage"));
const AdminProductPage = lazy(() => import("@/admin/AdminProductPage"));

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-text">
      <p className="text-sm font-medium">Memuat halaman...</p>
    </div>
  );
}

export default function App() {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const location = useLocation();

  const hideChatWidgetRoutes = [
    "/sign-in",
    "/sign-up",
    "/admin/login",
    "/admin/account",
    "/admin/order",
    "/admin/chat",
    "/admin/product",
  ];
  const shouldShowChatWidget = !hideChatWidgetRoutes.includes(
    location.pathname,
  );

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoading(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AuthProvider>
      <AnimatePresence mode="wait">
        {isInitialLoading ? (
          <motion.div
            key="app-loader"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}>
            <AppLoader />
          </motion.div>
        ) : (
          <motion.div
            key="app-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}>
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/cart" element={<CartPage />} />

                <Route element={<RequireAuth />}>
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                </Route>

                <Route path="/message" element={<MessagePage />} />
                <Route path="/sign-in" element={<SignInPage />} />
                <Route path="/sign-up" element={<SignUpPage />} />
                <Route
                  path="/category/:categoryId"
                  element={<CategoryPage />}
                />
                <Route
                  path="/payment-success"
                  element={<PaymentSuccessPage />}
                />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/help" element={<HelpPage />} />
                <Route path="*" element={<NotFoundPage />} />

                {/* Admin */}
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route element={<RequireAdminAuth />}>
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route path="account" element={<AdminAccountPage />} />
                    <Route path="order" element={<AdminOrderPage />} />
                    <Route path="chat" element={<AdminChatPage />} />
                    <Route path="product" element={<AdminProductPage />} />
                  </Route>
                </Route>
              </Routes>
            </Suspense>
            {shouldShowChatWidget && <ChatWidget />}
            <ToastContainer />
          </motion.div>
        )}
      </AnimatePresence>
    </AuthProvider>
  );
}
