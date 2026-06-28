import React, { useState } from "react";
import { ref, get } from "firebase/database";
import { db } from "../firebase.js";
import { LogIn, Loader2, AlertCircle, Trash2, Wifi } from "lucide-react";

export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Username dan password wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      const userRef = ref(db, `users/${username.trim()}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        setError("Username tidak ditemukan.");
        setLoading(false);
        return;
      }

      const userData = snapshot.val();
      if (userData.password !== password) {
        setError("Password salah.");
        setLoading(false);
        return;
      }

      sessionStorage.setItem("awas_logged_in_user", username.trim());
      onLoginSuccess(username.trim());
    } catch (err) {
      console.error(err);
      setError(
        "Gagal menghubungi database. Cek koneksi internet & konfigurasi Firebase."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-awas-50 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-awas-100/40 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-awas-200/30 blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-4 h-4 rounded-full bg-awas-300/30 animate-float" />
        <div className="absolute top-1/4 right-1/3 w-3 h-3 rounded-full bg-awas-400/20 animate-float" style={{ animationDelay: "1s" }} />
      </div>

      {/* Login card */}
      <div className="relative w-full max-w-sm animate-fade-in-up">
        {/* Logo / branding area */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-awas-500 to-awas-700 shadow-lg shadow-awas-500/20 mb-4">
            <Trash2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 font-display">Dashboard AWAS</h1>
          <p className="text-sm text-slate-500 mt-1">Pantau tempat sampah secara real-time</p>
        </div>

        {/* Form card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 shadow-xl shadow-slate-200/50 p-7">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                autoFocus
                className="input-field"
                placeholder="Masukan username"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="input-field"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2.5 text-xs text-red-600 bg-red-50/80 backdrop-blur rounded-xl px-3.5 py-2.5 border border-red-100 animate-scale-in">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {loading ? "Memeriksa..." : "Masuk"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-[11px] text-slate-400 text-center mt-6">
          Sistem Monitoring Tempat Sampah Berbasis IoT
        </p>
      </div>
    </div>
  );
}
