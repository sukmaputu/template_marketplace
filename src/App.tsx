import { lazy, Suspense, useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { AppLoader } from "@/components/Apploader";
import { ChatWidget } from "@/components/ChatWidget";
import { ToastContainer } from "@/components/ToastContainer";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { CurrencyProvider } from "@/components/navbar/CurrencySwitcher";
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
const ProductDetailPage = lazy(() => import("@/pages/ProductDetailPage"));

const PaymentSuccessPage = lazy(() => import("@/pages/Paymentsuccesspage"));

const RequireAuth = lazy(() =>
  import("@/components/auth/RequireAuth").then((mod) => ({
    default: mod.RequireAuth,
  })),
);

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

  const hideChatWidgetRoutes = ["/sign-in", "/sign-up"];
  const shouldShowChatWidget = !hideChatWidgetRoutes.includes(
    location.pathname,
  );

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoading(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <CurrencyProvider>
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
                    path="/product/:productId"
                    element={<ProductDetailPage />}
                  />
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
                </Routes>
              </Suspense>
              {shouldShowChatWidget && <ChatWidget />}
              <ToastContainer />
            </motion.div>
          )}
        </AnimatePresence>
      </AuthProvider>
    </CurrencyProvider>
  );
}
