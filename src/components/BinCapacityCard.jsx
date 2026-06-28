import React, { useEffect, useState } from "react";
import {
  Trash2,
  Flame,
  AlertTriangle,
  Wifi,
  WifiOff,
  Timer,
} from "lucide-react";

const GAS_LEVEL_STYLE = {
  normal: { label: "Normal", className: "bg-awas-50 text-awas-700 border-awas-200" },
  waspada: { label: "Waspada", className: "bg-amber-50 text-amber-700 border-amber-200" },
  bahaya: { label: "Bahaya", className: "bg-red-50 text-red-700 border-red-200" },
};

function capacityColor(percent) {
  if (percent >= 85) return "#ef4444";
  if (percent >= 60) return "#f59e0b";
  return "#10b981";
}

function capacityBg(percent) {
  if (percent >= 85) return "bg-red-500";
  if (percent >= 60) return "bg-amber-500";
  return "bg-awas-500";
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
  const [animateValue, setAnimateValue] = useState(false);

  const topic = `awas/${deviceId}/bin/status`;

  useEffect(() => {
    if (!mqttClient || !deviceId) return;

    const handleMessage = (payload) => {
      try {
        const parsed = typeof payload === "string" ? JSON.parse(payload) : payload;
        setData(parsed);
        setLastSeen(Date.now());
        setStale(false);
        setAnimateValue(true);
        onReading?.(deviceId, parsed);
      } catch {
        // ignore
      }
    };

    mqttClient.subscribe(topic, handleMessage);
    return () => mqttClient.unsubscribe?.(topic, handleMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mqttClient, deviceId]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (lastSeen && Date.now() - lastSeen > 30000) setStale(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [lastSeen]);

  // Reset animation trigger after it fires
  useEffect(() => {
    if (animateValue) {
      const t = setTimeout(() => setAnimateValue(false), 800);
      return () => clearTimeout(t);
    }
  }, [animateValue]);

  const percent = Math.min(100, Math.max(0, data?.capacity_percent ?? 0));
  const gasInfo = GAS_LEVEL_STYLE[data?.gas_level] || GAS_LEVEL_STYLE.normal;
  const color = capacityColor(percent);
  const circumference = 2 * Math.PI * 42; // r=42

  return (
    <div className="card card-lift overflow-hidden">
      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-awas-50 to-awas-100 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-awas-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{label || deviceId}</p>
            <p className="text-xs text-slate-400 font-mono">{deviceId}</p>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2">
          {stale || !data ? (
            <div className="badge bg-slate-50 text-slate-500 border-slate-200">
              <WifiOff className="w-3 h-3" />
              <span>Tidak ada data</span>
            </div>
          ) : (
            <div className="badge bg-awas-50 text-awas-700 border-awas-200">
              <span className="relative flex w-2 h-2">
                <span className="absolute inset-0 rounded-full bg-awas-500 animate-ping opacity-40" />
                <span className="relative rounded-full bg-awas-500 w-2 h-2" />
              </span>
              <Timer className="w-3 h-3" />
              <span>{formatTimeAgo(lastSeen)}</span>
            </div>
          )}
        </div>
      </div>

      {/* ===== BODY ===== */}
      <div className="px-5 sm:px-6 py-5 flex flex-col sm:flex-row items-center gap-6">
        {/* Gauge */}
        <div className="relative w-28 h-28 shrink-0">
          {/* Background ring */}
          <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90">
            <circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke="#f1f5f9"
              strokeWidth="8"
            />
            {/* Progress ring */}
            <circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${circumference}`}
              strokeDashoffset={circumference - (percent / 100) * circumference}
              className="gauge-fill"
              style={{
                filter: `drop-shadow(0 0 6px ${color}40)`,
              }}
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={`text-2xl font-bold transition-colors duration-500 ${
                percent >= 85 ? "text-red-500" : percent >= 60 ? "text-amber-500" : "text-awas-600"
              }`}
            >
              {percent}%
            </span>
            <span className="text-[10px] text-slate-400">terisi</span>
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 w-full space-y-3">
          {/* Capacity bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Kapasitas</span>
              <span className="font-medium text-slate-700">{percent}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${capacityBg(percent)}`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-slate-50 rounded-xl px-3.5 py-2.5">
              <p className="text-[11px] text-slate-400 mb-0.5">Jarak sensor</p>
              <p className="font-semibold text-slate-700">
                {data?.distance_cm !== undefined ? `${data.distance_cm} cm` : "—"}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl px-3.5 py-2.5">
              <p className="text-[11px] text-slate-400 mb-0.5">Gas (ppm)</p>
              <p className="font-semibold text-slate-700">{data?.gas_ppm ?? "—"}</p>
            </div>
          </div>

          {/* Gas level badge */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Level gas</span>
            <span className={`badge ${gasInfo.className}`}>
              <Flame className="w-3 h-3" />
              {gasInfo.label}
            </span>
          </div>
        </div>
      </div>

      {/* ===== ALERTS ===== */}
      {percent >= 85 && (
        <div className="flex items-center gap-2.5 px-5 sm:px-6 py-3 bg-red-50/80 backdrop-blur text-red-700 text-xs border-t border-red-100 animate-fade-in-up">
          <div className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <span>Kapasitas hampir penuh, perlu segera dikosongkan.</span>
        </div>
      )}
      {data?.gas_level === "bahaya" && (
        <div className="flex items-center gap-2.5 px-5 sm:px-6 py-3 bg-red-50/80 backdrop-blur text-red-700 text-xs border-t border-red-100 animate-fade-in-up">
          <div className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center">
            <Flame className="w-3.5 h-3.5" />
          </div>
          <span>Level gas berbahaya terdeteksi.</span>
        </div>
      )}
    </div>
  );
}
