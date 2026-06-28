import React, { useEffect, useState } from "react";
import { Trash2, Flame, AlertTriangle, Wifi, WifiOff } from "lucide-react";

/**
 * BinCapacityCard
 * ----------------
 * Menampilkan kapasitas tempat sampah secara real-time dari sensor
 * ultrasonik + level gas MQ-4, lewat MQTT.
 *
 * Topic yang digunakan (samakan dengan firmware ESP32 / Dashboard AWAS
 * yang sudah ada):
 *
 *   awas/{deviceId}/bin/status   <- ESP32 publish, retained
 *        payload: {
 *          distance_cm: number,        // jarak sensor ke permukaan sampah
 *          capacity_percent: number,    // 0-100, dihitung dari distance_cm
 *          gas_ppm: number,
 *          gas_level: "normal" | "waspada" | "bahaya",
 *          updatedAt: number (epoch ms) // opsional
 *        }
 *
 * Kalau struktur field di firmware kamu berbeda, cukup sesuaikan nama
 * field di dalam handleMessage di bawah ini — tidak perlu ubah bagian lain.
 */

const GAS_LEVEL_STYLE = {
  normal: { label: "Normal", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  waspada: { label: "Waspada", className: "bg-amber-50 text-amber-700 border-amber-200" },
  bahaya: { label: "Bahaya", className: "bg-red-50 text-red-700 border-red-200" },
};

function capacityColor(percent) {
  if (percent >= 85) return "#ef4444"; // merah
  if (percent >= 60) return "#f59e0b"; // amber
  return "#10b981"; // emerald
}

function formatTimeAgo(timestamp) {
  if (!timestamp) return "-";
  const diff = Math.max(0, Date.now() - timestamp);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec} detik lalu`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} menit lalu`;
  const hr = Math.floor(min / 60);
  return `${hr} jam lalu`;
}

export default function BinCapacityCard({ deviceId, label, mqttClient, onReading }) {
  const [data, setData] = useState(null);
  const [lastSeen, setLastSeen] = useState(null);
  const [stale, setStale] = useState(false);

  const topic = `awas/${deviceId}/bin/status`;

  useEffect(() => {
    if (!mqttClient || !deviceId) return;

    const handleMessage = (payload) => {
      try {
        const parsed = typeof payload === "string" ? JSON.parse(payload) : payload;
        setData(parsed);
        setLastSeen(Date.now());
        setStale(false);
        onReading?.(deviceId, parsed);
      } catch {
        // payload tidak valid, abaikan
      }
    };

    mqttClient.subscribe(topic, handleMessage);
    return () => mqttClient.unsubscribe?.(topic, handleMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mqttClient, deviceId]);

  // Anggap data "stale" (kemungkinan device offline) kalau tidak ada
  // update lebih dari 30 detik
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastSeen && Date.now() - lastSeen > 30000) {
        setStale(true);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [lastSeen]);

  const percent = Math.min(100, Math.max(0, data?.capacity_percent ?? 0));
  const gasInfo = GAS_LEVEL_STYLE[data?.gas_level] || GAS_LEVEL_STYLE.normal;
  const color = capacityColor(percent);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-slate-500" />
          <div>
            <p className="text-sm font-semibold text-slate-800">{label || deviceId}</p>
            <p className="text-xs text-slate-400">{deviceId}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          {stale || !data ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">Tidak ada data</span>
            </>
          ) : (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-slate-500">{formatTimeAgo(lastSeen)}</span>
            </>
          )}
        </div>
      </div>

      <div className="px-5 py-4 flex items-center gap-5">
        {/* Gauge lingkaran kapasitas */}
        <div className="relative w-24 h-24 shrink-0">
          <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth="10" />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke={color}
              strokeWidth="10"
              strokeDasharray={`${(percent / 100) * 263.9} 263.9`}
              strokeLinecap="round"
              style={{ transition: "stroke-dasharray 0.5s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-slate-800">{percent}%</span>
            <span className="text-[10px] text-slate-400">terisi</span>
          </div>
        </div>

        {/* Detail angka */}
        <div className="flex-1 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Jarak sensor</span>
            <span className="font-medium text-slate-700">
              {data?.distance_cm !== undefined ? `${data.distance_cm} cm` : "-"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Level gas</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium border ${gasInfo.className}`}
            >
              {gasInfo.label}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Gas (ppm)</span>
            <span className="font-medium text-slate-700">{data?.gas_ppm ?? "-"}</span>
          </div>
        </div>
      </div>

      {percent >= 85 && (
        <div className="flex items-center gap-2 px-5 py-2 bg-red-50 text-red-700 text-xs border-t border-red-100">
          <AlertTriangle className="w-3.5 h-3.5" />
          Kapasitas hampir penuh, perlu segera dikosongkan.
        </div>
      )}
      {data?.gas_level === "bahaya" && (
        <div className="flex items-center gap-2 px-5 py-2 bg-red-50 text-red-700 text-xs border-t border-red-100">
          <Flame className="w-3.5 h-3.5" />
          Level gas berbahaya terdeteksi.
        </div>
      )}
    </div>
  );
}
