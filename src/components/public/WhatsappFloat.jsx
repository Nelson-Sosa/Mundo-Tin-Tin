import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getWhatsappNumber } from "../../services/settingsService";

const CATALOG_MSG = "Hola, vi el catálogo de Mundo TIN-TIN y quisiera hacer una consulta 😊";
const DETAIL_MSG = "Hola, quisiera consultar por un producto que vi en el catálogo de Mundo TIN-TIN";

function buildUrl(phone, isDetail) {
  const text = isDetail ? DETAIL_MSG : CATALOG_MSG;
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

function WhatsAppIcon({ className }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M16 2C8.268 2 2 8.268 2 16c0 2.748.853 5.302 2.425 7.486L2.514 29.2a.625.625 0 00.763.763l5.714-1.911A13.944 13.944 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2z"
        fill="#25D366"
      />
      <path
        d="M23.098 20.016c-.372 1.043-1.483 1.916-2.555 2.162-.681.156-1.569.282-4.542-1.298-3.807-2.023-6.262-6.989-6.45-7.307-.193-.318-1.536-2.044-1.536-3.9 0-1.856.972-2.767 1.319-3.147.347-.38.756-.475 1.008-.475.253 0 .506.004.726.013.232.009.556-.09.87.666.314.757 1.069 2.623 1.164 2.813.095.19.158.413.031.667-.126.254-.19.413-.38.634-.19.221-.398.493-.572.663-.19.19-.388.396-.166.777.221.381.984 1.624 2.115 2.63 1.451 1.29 2.676 1.691 3.055 1.882.38.19.603.158.824-.095.222-.253.952-1.108 1.207-1.488.254-.38.507-.317.855-.19.348.126 2.21 1.042 2.59 1.233.38.19.632.285.696.444.063.158.063.918-.31 1.96z"
        fill="white"
      />
    </svg>
  );
}

export default function WhatsappFloat() {
  const { pathname } = useLocation();
  const [phone, setPhone] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getWhatsappNumber()
      .then((num) => setPhone(num || null))
      .finally(() => setReady(true));
  }, []);

  if (!ready) return null;
  if (!phone) return null;

  const isDetail = pathname !== "/catalogo" && pathname.startsWith("/catalogo/");
  const url = buildUrl(phone, isDetail);

  return (
    <>
      <style>{`
        @keyframes wa-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
        @keyframes wa-ring {
          0% { transform: scale(1); opacity: 0.35; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .wa-pulse { animation: wa-pulse 3s ease-in-out infinite; }
        .wa-pulse:hover { animation: none; }
        .wa-ring { animation: wa-ring 3s ease-out infinite; }
      `}</style>

      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end sm:bottom-6 sm:right-6">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contactar por WhatsApp"
          className="group relative wa-pulse flex h-12 w-12 items-center justify-center rounded-full shadow-lg shadow-green-500/30 transition-all duration-200 hover:scale-110 hover:shadow-xl hover:shadow-green-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 active:scale-95 sm:h-14 sm:w-14"
        >
          <span className="wa-ring pointer-events-none absolute inset-0 rounded-full bg-green-500/30" />

          <WhatsAppIcon className="relative h-7 w-7 sm:h-8 sm:w-8" />

          <span className="pointer-events-none absolute right-full mr-3 top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-gray-800/90 px-3 py-1.5 text-xs font-medium text-white shadow-sm backdrop-blur-sm opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:block">
            ¿Necesitás ayuda?
          </span>
        </a>
      </div>
    </>
  );
}
