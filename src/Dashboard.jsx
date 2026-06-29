import React, { useCallback, useState } from "react";
import { useMqtt } from "./hooks/useMqtt.js";
import WiFiConfigCard from "./components/WiFiConfigCard.jsx";
import BinCapacityCard from "./components/BinCapacityCard.jsx";
import CapacityTrendChart from "./components/CapacityTrendChart.jsx";
import TelegramFloatingButton from "./components/TelegramFloatingButton.jsx";
import {
  Wifi,
  WifiOff,
  Settings2,
  Gauge,
  LogOut,
  Trash2,
  ChevronDown,
} from "lucide-react";
const { mqttClient, connected } = useMqtt(brokerUrl, options)
const BROKER_URL = import.meta.env.VITE_MQTT_BROKER_URL || "https://awas-716bb-default-rtdb.asia-southeast1.firebasedatabase.app";
const MQTT_USERNAME = import.meta.env.VITE_MQTT_USERNAME || "awas-device";
const MQTT_PASSWORD = import.meta.env.VITE_MQTT_PASSWORD || "Testing123";

const DEVICES = [
  { id: "bin-01", label: "Tempat Sampah 1" },
];

const MAX_HISTORY_POINTS = 30;
const STAGGER_DELAY = 100; // ms between cards for staggered animation

export default function Dashboard({ username, onLogout }) {
  const { mqttClient, connected, error } = useMqtt(BROKER_URL, {
    username: MQTT_USERNAME,
    password: MQTT_PASSWORD,
  });
  const [selectedDevice, setSelectedDevice] = useState(DEVICES[0].id);
  const [activeTab, setActiveTab] = useState("monitor");
  const [historyByDevice, setHistoryByDevice] = useState({});
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleReading = useCallback((deviceId, reading) => {
    const time = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setHistoryByDevice((prev) => {
      const existing = prev[deviceId] || [];
      const updated = [
        ...existing,
        { time, capacity_percent: reading.capacity_percent ?? 0 },
      ].slice(-MAX_HISTORY_POINTS);
      return { ...prev, [deviceId]: updated };
    });
  }, []);

  const selectedDeviceLabel =
    DEVICES.find((d) => d.id === selectedDevice)?.label || selectedDevice;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-awas-50/30">
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm shadow-slate-100/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left — Brand */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-awas-500 to-awas-700 shadow-sm">
                <Trash2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-800 font-display leading-tight">
                  Dashboard AWAS
                </h1>
                <p className="text-[10px] text-slate-400 leading-tight">Monitoring Tempat Sampah</p>
              </div>
            </div>

            {/* Right — Status & user */}
            <div className="flex items-center gap-3">
              {/* MQTT status badge */}
              <div
                className={`badge ${
                  connected
                    ? "bg-awas-50 text-awas-700 border-awas-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }`}
              >
                {connected ? (
                  <>
                    <span className="relative flex w-2 h-2">
                      <span className="absolute inset-0 rounded-full bg-awas-500 animate-ping opacity-40" />
                      <span className="relative rounded-full bg-awas-500 w-2 h-2" />
                    </span>
                    <Wifi className="w-3 h-3" />
                    <span className="hidden sm:inline">Broker terhubung</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3" />
                    <span className="hidden sm:inline">Broker tidak terhubung</span>
                  </>
                )}
              </div>

              {/* User dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu((v) => !v)}
                  className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-awas-400 to-awas-600 flex items-center justify-center text-white text-xs font-bold">
                    {username?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <span className="hidden sm:inline font-medium">{username}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 top-full mt-1 z-20 w-44 bg-white rounded-xl border border-slate-200 shadow-lg shadow-slate-200/50 py-1 animate-scale-in origin-top-right">
                      <div className="px-3 py-2 text-xs text-slate-400 border-b border-slate-100">
                        Masuk sebagai <span className="font-medium text-slate-600">{username}</span>
                      </div>
                      <button
                        onClick={() => { setShowUserMenu(false); onLogout(); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Keluar
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ===== ERROR BANNER ===== */}
      {error && (
        <div className="bg-red-50/80 backdrop-blur text-red-700 text-sm px-6 py-3 border-b border-red-100 animate-fade-in-down">
          <div className="max-w-5xl mx-auto flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
            Error koneksi MQTT: {error}. Cek apakah broker sudah jalan dan WebSocket listener aktif.
          </div>
        </div>
      )}

      {/* ===== MAIN CONTENT ===== */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Device selector pills */}
        <div className="flex gap-2 animate-fade-in-up">
          {DEVICES.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedDevice(d.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                selectedDevice === d.id
                  ? "bg-awas-600 text-white shadow-md shadow-awas-600/20 scale-[1.02]"
                  : "bg-white/70 backdrop-blur text-slate-600 border border-slate-200/60 hover:border-awas-300 hover:bg-awas-50/50 active:scale-[0.98]"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Tab navigation */}
        <div className="flex gap-1 bg-white/60 backdrop-blur rounded-xl p-1 border border-slate-200/40 shadow-sm animate-fade-in-up" style={{ animationDelay: "50ms" }}>
          <button
            onClick={() => setActiveTab("monitor")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === "monitor"
                ? "bg-white text-awas-700 shadow-sm border border-slate-200/60"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Gauge className="w-4 h-4" />
            <span>Pemantauan Kapasitas</span>
          </button>
          <button
            onClick={() => setActiveTab("wifi")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === "wifi"
                ? "bg-white text-awas-700 shadow-sm border border-slate-200/60"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Settings2 className="w-4 h-4" />
            <span>Konfigurasi WiFi</span>
          </button>
        </div>

        {/* Tab content with slide transition */}
        <div className="relative">
          {activeTab === "monitor" && (
            <div key="monitor" className="space-y-5 animate-slide-up">
              <BinCapacityCard
                deviceId={selectedDevice}
                label={selectedDeviceLabel}
                mqttClient={mqttClient}
                onReading={handleReading}
              />
              <CapacityTrendChart
                history={historyByDevice[selectedDevice]}
                label={selectedDeviceLabel}
              />
            </div>
          )}

          {activeTab === "wifi" && (
            <div key="wifi" className="animate-slide-up">
              <WiFiConfigCard deviceId={selectedDevice} mqttClient={mqttClient} />
            </div>
          )}
        </div>
      </main>

      <TelegramFloatingButton />
    </div>
  );
}
