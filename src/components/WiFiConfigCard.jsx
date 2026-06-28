import React, { useState, useEffect, useCallback } from "react";
import { Wifi, WifiOff, Loader2, CheckCircle2, XCircle, Signal, Eye, EyeOff } from "lucide-react";

/**
 * WiFiConfigCard
 * ---------------
 * Card untuk Dashboard AWAS yang menampilkan status koneksi WiFi sebuah
 * device ESP32, dan memungkinkan pengiriman kredensial WiFi baru via MQTT.
 *
 * Topic MQTT yang dipakai (sesuaikan prefix dengan konvensi project kamu):
 *   awas/{deviceId}/wifi/status      <- ESP32 publish, retained
 *        payload: { connected, ssid, ip, rssi, updatedAt }
 *   awas/{deviceId}/wifi/set         -> Dashboard publish
 *        payload: { ssid, password }
 *   awas/{deviceId}/wifi/set/ack     <- ESP32 publish hasil percobaan
 *        payload: { status: "connecting" | "success" | "failed", message }
 *
 * Props:
 *   deviceId   : string                          - id unik device, contoh "bin-01"
 *   mqttClient : objek MQTT client (mis. dari mqtt.js) yang sudah connect.
 *                Harus punya method: subscribe(topic, cb), publish(topic, payload), unsubscribe(topic)
 *                Sesuaikan adapter ini dengan client MQTT yang sudah dipakai
 *                di Dashboard AWAS kamu sekarang.
 */

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
          className={`w-1 rounded-sm transition-colors ${
            i <= bars ? "bg-emerald-500" : "bg-slate-200"
          }`}
          style={{ height: `${i * 3 + 3}px` }}
        />
      ))}
    </div>
  );
}

export default function WiFiConfigCard({ deviceId, mqttClient }) {
  const [status, setStatus] = useState(null); // { connected, ssid, ip, rssi, updatedAt }
  const [ackState, setAckState] = useState(null); // { status, message }
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
        // payload tidak valid, abaikan
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
        // payload tidak valid, abaikan
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

      // Timeout jaga-jaga kalau device tidak merespons sama sekali
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
    <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header status */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          {connected ? (
            <Wifi className="w-5 h-5 text-emerald-600" />
          ) : (
            <WifiOff className="w-5 h-5 text-slate-400" />
          )}
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {connected ? "Terhubung ke WiFi" : "Tidak terhubung"}
            </p>
            <p className="text-xs text-slate-500">{deviceId}</p>
          </div>
        </div>
        {connected && (
          <div className="flex items-center gap-1.5">
            <SignalBars bars={signal.bars} />
            <span className="text-xs text-slate-500">{signal.label}</span>
          </div>
        )}
      </div>

      {/* Detail koneksi saat ini */}
      {connected && (
        <div className="grid grid-cols-2 gap-3 px-5 py-3 bg-slate-50 text-xs">
          <div>
            <p className="text-slate-400">SSID</p>
            <p className="font-medium text-slate-700">{status?.ssid || "-"}</p>
          </div>
          <div>
            <p className="text-slate-400">Alamat IP</p>
            <p className="font-medium text-slate-700 font-mono">{status?.ip || "-"}</p>
          </div>
        </div>
      )}

      {!status && (
        <div className="px-5 py-3 bg-amber-50 text-xs text-amber-700 flex items-center gap-2">
          <Signal className="w-3.5 h-3.5" />
          Menunggu data status dari device...
        </div>
      )}

      {/* Form ganti WiFi */}
      <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
        <p className="text-sm font-medium text-slate-700">Ganti jaringan WiFi</p>

        <div>
          <label htmlFor={`ssid-${deviceId}`} className="block text-xs text-slate-500 mb-1">
            Nama WiFi (SSID)
          </label>
          <input
            id={`ssid-${deviceId}`}
            type="text"
            value={form.ssid}
            onChange={(e) => setForm((f) => ({ ...f, ssid: e.target.value }))}
            placeholder="Contoh: Rumah_Fildza"
            disabled={submitting}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-slate-50"
          />
        </div>

        <div>
          <label htmlFor={`pass-${deviceId}`} className="block text-xs text-slate-500 mb-1">
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
              className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-slate-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        {ackState && (
          <div
            className={`flex items-start gap-2 rounded-lg px-3 py-2 text-xs ${
              ackState.status === "success"
                ? "bg-emerald-50 text-emerald-700"
                : ackState.status === "failed"
                ? "bg-red-50 text-red-700"
                : "bg-blue-50 text-blue-700"
            }`}
          >
            {ackState.status === "success" && <CheckCircle2 className="w-3.5 h-3.5 mt-0.5" />}
            {ackState.status === "failed" && <XCircle className="w-3.5 h-3.5 mt-0.5" />}
            {ackState.status === "connecting" && (
              <Loader2 className="w-3.5 h-3.5 mt-0.5 animate-spin" />
            )}
            <span>{ackState.message}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-emerald-600 text-white text-sm font-medium py-2.5 hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitting ? "Menghubungkan..." : "Simpan & Hubungkan"}
        </button>
      </form>
    </div>
  );
}

/* ---------------------------------------------------------------------
   Contoh pemakaian di dashboard:

   import WiFiConfigCard from "./WiFiConfigCard";

   <WiFiConfigCard deviceId="bin-01" mqttClient={mqttClient} />

   `mqttClient` minimal harus punya bentuk seperti ini (sesuaikan dengan
   client MQTT yang sudah dipakai di Dashboard AWAS, mis. mqtt.js / paho):

   const mqttClient = {
     subscribe: (topic, cb) => {
       client.subscribe(topic);
       client.on("message", (t, msg) => {
         if (t === topic) cb(msg.toString());
       });
     },
     publish: (topic, payload) => client.publish(topic, payload),
     unsubscribe: (topic) => client.unsubscribe(topic),
   };
--------------------------------------------------------------------- */
