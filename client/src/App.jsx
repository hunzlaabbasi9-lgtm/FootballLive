import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Paywall from "./pages/Paywall";
import PaymentSuccess from "./pages/PaymentSuccess";
import Matches from "./pages/Matches";
import Watch from "./pages/Watch";

function Shell({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex flex-col pt-20">{children}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Shell>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Logged in (paid or not) */}
            <Route path="/paywall" element={<ProtectedRoute><Paywall /></ProtectedRoute>} />
            <Route path="/payment/success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />

            {/* Logged in AND paid */}
            <Route path="/matches" element={<ProtectedRoute requirePaid><Matches /></ProtectedRoute>} />
            <Route path="/watch/:index" element={<ProtectedRoute requirePaid><Watch /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Shell>
      </BrowserRouter>
    </AuthProvider>
  );
}
