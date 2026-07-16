import { useEffect, useState } from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";

import SplashScreen from "./components/SplashScreen";

import Home from "./pages/Home";
import Card from "./pages/Card";
import Register from "./pages/Register";
import Benefits from "./pages/Benefits";
import Admin from "./pages/Admin";
import Verify from "./pages/Verify";
import Login from "./pages/Login";
import AdminMembers from "./pages/AdminMembers";
import AdminBenefits from "./pages/AdminBenefits";
import AdminMessages from "./pages/AdminMessages";
import Messages from "./pages/Messages";
import VerifyEmail from "./pages/VerifyEmail";

export default function App() {
  const [showSplash, setShowSplash] = useState(() => {
    return sessionStorage.getItem("tautoSplashShown") !== "true";
  });

  useEffect(() => {
    if (!showSplash) return;

    const timer = window.setTimeout(() => {
      sessionStorage.setItem("tautoSplashShown", "true");
      setShowSplash(false);
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [showSplash]);

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/card" element={<Card />} />
        <Route path="/register" element={<Register />} />
        <Route path="/benefits" element={<Benefits />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/members" element={<AdminMembers />} />
        <Route path="/admin/benefits" element={<AdminBenefits />} />
        <Route path="/admin/messages" element={<AdminMessages />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/verify/:code" element={<Verify />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
      </Routes>
    </Router>
  );
}