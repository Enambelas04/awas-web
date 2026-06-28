import React, { useState } from "react";
import { ref, get } from "firebase/database";
import { db } from "../firebase.js";
import { LogIn, Loader2, AlertCircle } from "lucide-react";

/**
 * LoginPage
 * ----------
 * Login sederhana untuk SIMULASI/DEMO — username & password dicocokkan
 * langsung ke data yang tersimpan di Firebase Realtime Database, di path:
 *
 *   /users/{username}/password
 *
 * Contoh struktur data di Firebase Realtime Database:
 * {
 *   "users": {
 *     "fildza": { "password": "rahasia123" },
 *     "admin":  { "password": "admin123" }
 *   }
 * }
 *
 * ============================ PENTING ============================
 * Ini BUKAN cara aman untuk production:
 *  - Password tersimpan plain text (siapa pun yang akses Firebase Console
 *    atau punya akses baca ke path /users bisa lihat semua password)
 *  - Pengecekan password dilakukan di sisi client (browser), bukan
 *    server — secara teknis siapa pun yang paham DevTools bisa baca
 *    rules/data kalau Firebase Rules tidak dibatasi dengan benar
 *  - Cocok untuk demo/simulasi skripsi, TIDAK cocok untuk data sensitif
 *    sungguhan. Untuk production, pakai Firebase Authentication
 *    (signInWithEmailAndPassword) yang sudah handle hashing & keamanan.
 * ===================================================================
 */
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

      // Login berhasil — simpan sesi sederhana di sessionStorage
      // (hilang otomatis saat tab ditutup; cukup untuk simulasi)
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
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-slate-800">Dashboard AWAS</h1>
          <p className="text-sm text-slate-500 mt-1">Masuk untuk melanjutkan</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoFocus
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-slate-50"
              placeholder="Masukan username"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-slate-50"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-600 text-white text-sm font-medium py-2.5 hover:bg-emerald-700 disabled:bg-emerald-300 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            {loading ? "Memeriksa..." : "Masuk"}
          </button>
        </form>

        <p className="text-[11px] text-slate-400 text-center mt-5">
          Login Page
        </p>
      </div>
    </div>
  );
}
