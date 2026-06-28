import React, { useState, useEffect } from "react";
import LoginPage from "./components/LoginPage.jsx";
import Dashboard from "./Dashboard.jsx";

export default function App() {
  const [username, setUsername] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const saved = sessionStorage.getItem("awas_logged_in_user");
    if (saved) setUsername(saved);
    // Brief delay so the loading screen is visible even on fast reconnect
    const timer = setTimeout(() => setCheckingSession(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("awas_logged_in_user");
    setUsername(null);
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-awas-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-2 border-awas-200" />
            <div className="absolute inset-0 rounded-full border-2 border-awas-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-sm text-slate-400 animate-pulse-soft">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  if (!username) {
    return <LoginPage onLoginSuccess={setUsername} />;
  }

  return <Dashboard username={username} onLogout={handleLogout} />;
}
