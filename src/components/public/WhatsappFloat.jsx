import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getWhatsappNumber } from "../../services/settingsService";

const CATALOG_MSG = "Hola, vi el catálogo de Mundo TIN-TIN y quisiera hacer una consulta 😊";
const DETAIL_MSG = "Hola, quisiera consultar por un producto que vi en el catálogo de Mundo TIN-TIN";

function buildUrl(phone, isDetail) {
  const text = isDetail ? DETAIL_MSG : CATALOG_MSG;
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
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
          className="group relative wa-pulse block h-12 w-12 rounded-full shadow-lg shadow-green-500/30 transition-all duration-200 hover:scale-110 hover:shadow-xl hover:shadow-green-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 active:scale-95 sm:h-14 sm:w-14"
        >
          <span className="wa-ring pointer-events-none absolute inset-0 rounded-full bg-green-500/30" />

          <img
            src="/logoWhattssapp.jpg"
            alt=""
            className="relative h-full w-full rounded-full object-cover"
          />

          <span className="pointer-events-none absolute right-full mr-3 top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-gray-800/90 px-3 py-1.5 text-xs font-medium text-white shadow-sm backdrop-blur-sm opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:block">
            ¿Necesitás ayuda?
          </span>
        </a>
      </div>
    </>
  );
}
