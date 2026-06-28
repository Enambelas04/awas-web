import React, { useState, useEffect, useCallback } from "react";
import {
  Wifi,
  WifiOff,
  Loader2,
  CheckCircle2,
  XCircle,
  Signal,
  Eye,
  EyeOff,
  Router,
  Globe,
} from "lucide-react";

function rssiToLabel(rssi) {
  if (rssi === null || rssi === undefined) return { label: "-", bars: 0 };
  if (rssi >= -55) return { label: "Sangat baik", bars: 4 };
  if (rssi >= -67) return { label: "Baik", bars: 3 };
  if (rssi >= -75) return { label: "Lemah", bars: 2 };
  return { label: "Sangat lemah", bars: 1 };
}

function SignalBars({ bars }) {
  return (
    <div className="flex items-end gap-0.5 h-4" aria-hidden="true">
      {[1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={`w-1.5 rounded-sm transition-all duration-300 ${
            i <= bars ? "bg-awas-500" : "bg-slate-200"
          }`}
          style={{ height: `${i * 3 + 3}px` }}
        />
      ))}
    </div>
  );
}

export default function WiFiConfigCard({ deviceId, mqttClient }) {
  const [status, setStatus] = useState(null);
  const [ackState, setAckState] = useState(null);
  const [form, setForm] = useState({ ssid: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const statusTopic = `awas/${deviceId}/wifi/status`;
  const setTopic = `awas/${deviceId}/wifi/set`;
  const ackTopic = `awas/${deviceId}/wifi/set/ack`;

  useEffect(() => {
    if (!mqttClient || !deviceId) return;

    const handleStatus = (payload) => {
      try {
        const data = typeof payload === "string" ? JSON.parse(payload) : payload;
        setStatus(data);
      } catch {
        // ignore
      }
    };

    const handleAck = (payload) => {
      try {
        const data = typeof payload === "string" ? JSON.parse(payload) : payload;
        setAckState(data);
        if (data.status === "success" || data.status === "failed") {
          setSubmitting(false);
        }
      } catch {
        // ignore
      }
    };

    mqttClient.subscribe(statusTopic, handleStatus);
    mqttClient.subscribe(ackTopic, handleAck);

    return () => {
      mqttClient.unsubscribe?.(statusTopic, handleStatus);
      mqttClient.unsubscribe?.(ackTopic, handleAck);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mqttClient, deviceId]);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      setError("");

      if (!form.ssid.trim()) {
        setError("Nama WiFi (SSID) wajib diisi.");
        return;
      }
      if (!mqttClient) {
        setError("Koneksi MQTT belum siap.");
        return;
      }

      setSubmitting(true);
      setAckState({ status: "connecting", message: "Mengirim konfigurasi ke device..." });

      mqttClient.publish(
        setTopic,
        JSON.stringify({ ssid: form.ssid.trim(), password: form.password })
      );

      setTimeout(() => {
        setSubmitting((current) => {
          if (current) {
            setAckState({
              status: "failed",
              message: "Device tidak merespons. Pastikan ESP32 masih menyala dan terhubung ke broker.",
            });
          }
          return false;
        });
      }, 20000);
    },
    [form, mqttClient, setTopic]
  );

  const connected = status?.connected;
  const signal = rssiToLabel(status?.rssi);

  return (
    <div className="card card-lift overflow-hidden">
      {/* Header */}
      <div className="px-5 sm:px-6 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              connected
                ? "bg-gradient-to-br from-awas-50 to-awas-100"
                : "bg-slate-100"
            }`}>
              {connected
                ? <Wifi className="w-5 h-5 text-awas-600" />
                : <WifiOff className="w-5 h-5 text-slate-400" />
              }
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {connected ? "Terhubung ke WiFi" : "Tidak terhubung"}
              </p>
              <p className="text-xs text-slate-400 font-mono">{deviceId}</p>
            </div>
          </div>
          {connected && (
            <div className="flex items-center gap-2">
              <SignalBars bars={signal.bars} />
              <span className="text-xs text-slate-500 font-medium">{signal.label}</span>
            </div>
          )}
        </div>
      </div>

      {/* Connection details */}
      {connected && (
        <div className="grid grid-cols-2 gap-px bg-slate-100">
          <div className="bg-slate-50/80 px-5 py-3">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-0.5">
              <Router className="w-3 h-3" /> SSID
            </div>
            <p className="text-sm font-medium text-slate-700">{status?.ssid || "-"}</p>
          </div>
          <div className="bg-slate-50/80 px-5 py-3">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-0.5">
              <Globe className="w-3 h-3" /> Alamat IP
            </div>
            <p className="text-sm font-medium text-slate-700 font-mono">{status?.ip || "-"}</p>
          </div>
        </div>
      )}

      {/* Waiting indicator */}
      {!status && (
        <div className="px-5 sm:px-6 py-3 bg-amber-50/80 backdrop-blur text-amber-700 text-xs flex items-center gap-2 border-b border-amber-100">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse-soft" />
          Menunggu data status dari device...
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-5 sm:px-6 py-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-0.5 h-4 rounded-full bg-awas-500" />
          <p className="text-sm font-semibold text-slate-700">Ganti jaringan WiFi</p>
        </div>

        <div>
          <label htmlFor={`ssid-${deviceId}`} className="block text-xs font-medium text-slate-500 mb-1.5">
            Nama WiFi (SSID)
          </label>
          <input
            id={`ssid-${deviceId}`}
            type="text"
            value={form.ssid}
            onChange={(e) => setForm((f) => ({ ...f, ssid: e.target.value }))}
            placeholder="Contoh: Rumah_Fildza"
            disabled={submitting}
            className="input-field"
          />
        </div>

        <div>
          <label htmlFor={`pass-${deviceId}`} className="block text-xs font-medium text-slate-500 mb-1.5">
            Kata sandi
          </label>
          <div className="relative">
            <input
              id={`pass-${deviceId}`}
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="Kata sandi WiFi"
              disabled={submitting}
              className="input-field pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 text-xs text-red-600 bg-red-50/80 backdrop-blur rounded-xl px-3.5 py-2.5 border border-red-100 animate-scale-in">
            <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {ackState && (
          <div
            className={`flex items-start gap-2.5 rounded-xl px-3.5 py-2.5 text-xs border animate-fade-in-up ${
              ackState.status === "success"
                ? "bg-awas-50 text-awas-700 border-awas-200"
                : ackState.status === "failed"
                ? "bg-red-50 text-red-700 border-red-100"
                : "bg-blue-50 text-blue-700 border-blue-100"
            }`}
          >
            {ackState.status === "success" && <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />}
            {ackState.status === "failed" && <XCircle className="w-4 h-4 mt-0.5 shrink-0" />}
            {ackState.status === "connecting" && (
              <Loader2 className="w-4 h-4 mt-0.5 shrink-0 animate-spin" />
            )}
            <span>{ackState.message}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitting ? "Menghubungkan..." : "Simpan & Hubungkan"}
        </button>
      </form>
    </div>
  );
}
