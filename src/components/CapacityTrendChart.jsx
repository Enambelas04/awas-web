import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { TrendingUp, BarChart3 } from "lucide-react";

export default function CapacityTrendChart({ history, label }) {
  if (!history || history.length < 2) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-4 h-4 text-slate-400" />
          <p className="text-sm font-medium text-slate-700">
            Tren kapasitas — {label}
          </p>
        </div>

        {/* Skeleton placeholder */}
        <div className="mt-4 space-y-2">
          <div className="h-36 rounded-xl bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 skeleton-shimmer" />
          <p className="text-xs text-slate-400 text-center pt-2">
            Menunggu data lebih banyak untuk menampilkan grafik...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card card-lift p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-awas-50 to-awas-100 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-awas-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">
            Tren kapasitas — {label}
          </p>
          <p className="text-[11px] text-slate-400">
            {history.length} titik data terakhir
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={history} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="capacityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            axisLine={{ stroke: "#e2e8f0" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            tickFormatter={(v) => `${v}%`}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value) => [`${value}%`, "Kapasitas"]}
            labelStyle={{ fontSize: 12, fontWeight: 600 }}
            contentStyle={{
              fontSize: 12,
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            }}
          />
          <Area
            type="monotone"
            dataKey="capacity_percent"
            stroke="#10b981"
            strokeWidth={2.5}
            fill="url(#capacityGradient)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff", fill: "#10b981" }}
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
