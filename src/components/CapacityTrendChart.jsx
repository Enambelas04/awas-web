import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/**
 * CapacityTrendChart
 * -------------------
 * Menampilkan grafik perubahan kapasitas (%) dari waktu ke waktu untuk
 * satu device, berdasarkan history yang dikumpulkan selama halaman terbuka.
 *
 * `history` berbentuk array: [{ time: "14:32:10", capacity_percent: 42 }, ...]
 */
export default function CapacityTrendChart({ history, label }) {
  if (!history || history.length < 2) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
        <p className="text-sm font-medium text-slate-700 mb-1">
          Tren kapasitas — {label}
        </p>
        <p className="text-xs text-slate-400">
          Menunggu data lebih banyak untuk menampilkan grafik...
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
      <p className="text-sm font-medium text-slate-700 mb-3">
        Tren kapasitas — {label}
      </p>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={history} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#94a3b8" }} />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            formatter={(value) => [`${value}%`, "Kapasitas"]}
            labelStyle={{ fontSize: 12 }}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Line
            type="monotone"
            dataKey="capacity_percent"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
