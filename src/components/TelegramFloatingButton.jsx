import React from "react";

const BOT_USERNAME = "AwasBot"; // <-- GANTI dengan username bot Telegram kamu

export default function TelegramFloatingButton({ username = BOT_USERNAME }) {
  const telegramUrl = `https://t.me/Awas_UIKA_bot`;

  return (
    <a
      href={telegramUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Buka chat Telegram AWAS"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-[#2AABEE] to-[#229ED9] shadow-lg shadow-[#229ED9]/25 flex items-center justify-center hover:shadow-xl hover:shadow-[#229ED9]/30 hover:scale-110 active:scale-95 transition-all duration-300 ease-out animate-float"
      style={{ animationDelay: "2s" }}
    >
      <div className="absolute inset-0 rounded-full bg-white/10 animate-ping opacity-20" style={{ animationDuration: "3s" }} />
      <svg
        viewBox="0 0 240 240"
        className="w-8 h-8 relative z-10"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="120" cy="120" r="120" fill="#229ED9" />
        <path
          d="M170.8 72.6 149.5 175.8c-1.6 7.1-5.8 8.9-11.7 5.5l-32.4-23.9-15.6 15c-1.7 1.7-3.2 3.2-6.5 3.2l2.3-33.1 60.2-54.4c2.6-2.3-.6-3.6-4-1.3l-74.5 46.9-32.1-10c-7-2.2-7.1-7 1.5-10.3l125.7-48.5c5.8-2.1 10.9 1.4 9 9.7z"
          fill="#ffffff"
        />
      </svg>
    </a>
  );
}
