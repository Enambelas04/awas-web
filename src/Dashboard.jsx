import React, { useCallback, useState } from "react";
import { useMqtt } from "./hooks/useMqtt.js";
import WiFiConfigCard from "./components/WiFiConfigCard.jsx";
import BinCapacityCard from "./components/BinCapacityCard.jsx";
import CapacityTrendChart from "./components/CapacityTrendChart.jsx";
import TelegramFloatingButton from "./components/TelegramFloatingButton.jsx";
import { Wifi, WifiOff, Settings2, Gauge, LogOut } from "lucide-react";

// Ganti dengan alamat broker MQTT kamu.
// - Lokal (Mosquitto via docker compose): "ws://localhost:9001"
// - HiveMQ Cloud: "wss://xxxxxxxx.s1.eu.hivemq.cloud:8884/mqtt"
const BROKER_URL = import.meta.env.VITE_MQTT_BROKER_URL || "ws://localhost:9001";

// Username/password hanya diisi kalau broker butuh auth (mis. HiveMQ Cloud).
// Untuk Mosquitto lokal dengan allow_anonymous, biarkan kosong di .env.
const MQTT_USERNAME = import.meta.env.VITE_MQTT_USERNAME || undefined;
const MQTT_PASSWORD = import.meta.env.VITE_MQTT_PASSWORD || undefined;

// Daftar device ESP32 yang ingin ditampilkan
const DEVICES = [
  { id: "bin-01", label: "Tempat Sampah 1" },

];

const MAX_HISTORY_POINTS = 30;

export default function Dashboard({ username, onLogout }) {
  const { mqttClient, connected, error } = useMqtt(BROKER_URL, {
    username: MQTT_USERNAME,
    password: MQTT_PASSWORD,
  });
  const [selectedDevice, setSelectedDevice] = useState(DEVICES[0].id);
  const [activeTab, setActiveTab] = useState("monitor"); // "monitor" | "wifi"
  const [historyByDevice, setHistoryByDevice] = useState({}); // { [deviceId]: [{time, capacity_percent}] }

  // Dipanggil setiap kali BinCapacityCard menerima data baru, supaya
  // history terkumpul untuk grafik tren — disimpan di state App supaya
  // tetap ada walau card individual re-render.
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
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-800">Dashboard AWAS</h1>

        <div className="flex items-center gap-4 text-sm">
          {connected ? (
            <span className="flex items-center gap-2 text-emerald-600 font-medium">
              <Wifi className="w-4 h-4" /> Broker terhubung
            </span>
          ) : (
            <span className="flex items-center gap-2 text-red-500 font-medium">
              <WifiOff className="w-4 h-4" /> Broker tidak terhubung
            </span>
          )}

          <span className="text-slate-400">|</span>

          <span className="text-slate-600">{username}</span>
          <button
            onClick={onLogout}
            className="flex items-center gap-1 text-slate-500 hover:text-red-600 transition-colors"
            title="Keluar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-6 py-2 border-b border-red-100">
          Error koneksi MQTT: {error}. Cek apakah broker di {BROKER_URL} sudah jalan
          dan WebSocket listener aktif.
        </div>
      )}

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Pemilih device */}
        <div className="flex gap-2">
          {DEVICES.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedDevice(d.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                selectedDevice === d.id
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Tab navigasi */}
        <div className="flex gap-1 border-b border-slate-200">
          <button
            onClick={() => setActiveTab("monitor")}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "monitor"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Gauge className="w-4 h-4" />
            Pemantauan Kapasitas
          </button>
          <button
            onClick={() => setActiveTab("wifi")}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "wifi"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Settings2 className="w-4 h-4" />
            Konfigurasi WiFi
          </button>
        </div>

        {/* Konten tab */}
        {activeTab === "monitor" && (
          <div className="space-y-4">
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
          <WiFiConfigCard deviceId={selectedDevice} mqttClient={mqttClient} />
        )}
      </main>

      <TelegramFloatingButton />
    </div>
  );
}
