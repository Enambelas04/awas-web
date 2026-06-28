import React, { useState, useEffect } from "react";
import LoginPage from "./components/LoginPage.jsx";
import Dashboard from "./Dashboard.jsx";

export default function App() {
  const [username, setUsername] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Cek apakah sudah pernah login di tab ini sebelumnya (sessionStorage),
  // supaya tidak perlu login ulang setiap kali halaman di-refresh.
  useEffect(() => {
    const saved = sessionStorage.getItem("awas_logged_in_user");
    if (saved) setUsername(saved);
    setCheckingSession(false);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("awas_logged_in_user");
    setUsername(null);
  };

  if (checkingSession) {
    return <div className="min-h-screen bg-slate-100" />;
  }

  if (!username) {
    return <LoginPage onLoginSuccess={setUsername} />;
  }

  return <Dashboard username={username} onLogout={handleLogout} />;
}
