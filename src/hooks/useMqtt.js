import { useEffect, useRef, useState, useMemo } from "react";
import mqtt from "mqtt";

/**
 * useMqtt
 * -------
 * Hook untuk konek ke MQTT broker dari browser via WebSocket.
 *
 * MENDUKUNG 2 MODE:
 * 1. Broker lokal tanpa auth (Mosquitto via docker compose):
 *      brokerUrl: "ws://localhost:9001"
 *      (tidak perlu username/password)
 *
 * 2. HiveMQ Cloud / broker dengan TLS + auth:
 *      brokerUrl: "wss://xxxxxxxx.s1.eu.hivemq.cloud:8884/mqtt"
 *      options:   { username: "...", password: "..." }
 *
 * PENTING soal wss vs ws:
 * Kalau web di-hosting di HTTPS (GitHub Pages, Vercel, dll), browser akan
 * MEMBLOKIR koneksi ws:// (tidak aman/mixed content). Wajib pakai wss://
 * dengan broker yang sudah punya TLS aktif (HiveMQ Cloud sudah otomatis).
 *
 * PERBAIKAN (penting):
 * Sebelumnya objek `mqttClient` yang dikembalikan hook ini dibuat ULANG
 * setiap kali komponen re-render. Karena objeknya beda referensi tiap
 * render, komponen yang memakai `mqttClient` di dependency array useEffect
 * (misal BinCapacityCard) akan terus menjalankan cleanup (unsubscribe) lalu
 * subscribe ulang berkali-kali — inilah sebabnya subscription di HiveMQ
 * terlihat "muncul-hilang" terus.
 *
 * Solusinya: bungkus objek `mqttClient` dengan useMemo(() => ({...}), [])
 * supaya referensinya STABIL selama lifetime komponen, tidak dibuat ulang
 * tiap render.
 */
export function useMqtt(brokerUrl, options = {}) {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const clientRef = useRef(null);
  const subscribersRef = useRef({}); // { topic: Set<callback> }

  useEffect(() => {
  if (!brokerUrl) return;
  const client = mqtt.connect(brokerUrl, { ...options });
  // ...
  return () => { client.end(true); };
}, [brokerUrl, options.username, options.password]);
      reconnectPeriod: 3000,
      connectTimeout: 8000,
      // clientId unik supaya tidak bentrok kalau ada beberapa tab/device
      // terbuka bersamaan dengan kredensial yang sama
      clientId: `awas-web-${Math.random().toString(16).slice(2, 10)}`,
      ...options, // username, password, dll disisipkan dari sini
    });
    clientRef.current = client;

    client.on("connect", () => {
      setConnected(true);
      setError(null);
      // Re-subscribe semua topic yang sudah didaftarkan sebelumnya,
      // penting setelah reconnect (mis. koneksi putus sebentar lalu nyambung lagi)
      Object.keys(subscribersRef.current).forEach((topic) => {
        if (subscribersRef.current[topic]?.size) {
          client.subscribe(topic);
        }
      });
    });

    client.on("reconnect", () => setConnected(false));
    client.on("close", () => setConnected(false));
    client.on("error", (err) => {
      setError(err?.message || "MQTT error");
      // Error auth (mis. username/password salah) biasanya tidak akan
      // resolve sendiri lewat reconnect — tetap dibiarkan retry, tapi
      // pesan error ditampilkan supaya kelihatan di UI.
    });
    client.on("message", (topic, payload) => {
      const callbacks = subscribersRef.current[topic];
      if (callbacks) {
        callbacks.forEach((cb) => cb(payload.toString()));
      }
    });

    return () => {
      client.end(true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brokerUrl, options.username, options.password]);

  // Adapter dengan bentuk { subscribe, publish, unsubscribe }
  // sesuai yang dibutuhkan WiFiConfigCard / BinCapacityCard
  //
  // PERBAIKAN: dibungkus useMemo dengan dependency array kosong [],
  // sehingga objek ini hanya dibuat SEKALI dan referensinya stabil
  // selama lifetime komponen. Method di dalamnya tetap mengakses
  // clientRef.current & subscribersRef.current secara live lewat closure
  // (ref selalu menunjuk ke objek terbaru, jadi aman dipakai di useMemo).
  const mqttClient = useMemo(
    () => ({
      subscribe(topic, cb) {
        if (!subscribersRef.current[topic]) {
          subscribersRef.current[topic] = new Set();
        }
        subscribersRef.current[topic].add(cb);
        clientRef.current?.subscribe(topic);
      },
      unsubscribe(topic, cb) {
        subscribersRef.current[topic]?.delete(cb);
        if (!subscribersRef.current[topic]?.size) {
          clientRef.current?.unsubscribe(topic);
          delete subscribersRef.current[topic];
        }
      },
      publish(topic, payload) {
        clientRef.current?.publish(topic, payload);
      },
    }),
    [] // <- dibuat sekali saja, referensi stabil sepanjang lifetime komponen
  );

  return { mqttClient, connected, error };
}
