import { useState, useEffect } from "react";
import { MessageCircle, Loader2 } from "lucide-react";
import { getWhatsappNumber } from "../../services/settingsService";

function buildWhatsAppUrl(phone, productName, productPrice) {
  const text = `Hola 👋%0AEstoy interesado en este producto:%0A%0A🛍 Producto: ${encodeURIComponent(productName)}%0A💲 Precio: ${encodeURIComponent(productPrice)}%0A%0A¿Sigue disponible?`;
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${text}`;
}

export default function WhatsAppButton({ productName, productPrice, variant = "floating" }) {
  const [phone, setPhone] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWhatsappNumber()
      .then((num) => setPhone(num || null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    if (variant === "floating") return null;
    return (
      <button disabled className="inline-flex items-center gap-2 rounded-lg bg-gray-200 px-5 py-3 text-sm font-medium text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        Cargando...
      </button>
    );
  }

  if (!phone) {
    if (variant === "floating") return null;
    return null;
  }

  const url = buildWhatsAppUrl(phone, productName, productPrice);

  if (variant === "floating") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-all hover:bg-green-600 hover:shadow-xl active:scale-95"
        title="Consultar por WhatsApp"
      >
        <MessageCircle className="h-7 w-7" />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-600 hover:shadow-md active:scale-[0.98] sm:w-auto sm:text-base"
    >
      <MessageCircle className="h-5 w-5" />
      Consultar por WhatsApp
    </a>
  );
}
