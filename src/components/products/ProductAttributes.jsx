import { useState, useRef, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { sanitizeText } from "../../utils/productValidation";

const PRESETS = [
  { name: "Color", values: [] },
  { name: "Talle", values: [] },
  { name: "Calce", values: [] },
  { name: "Material", values: [] },
  { name: "Tamaño", values: [] },
  { name: "Modelo", values: [] },
];

export default function ProductAttributes({ attributes = [], onChange, errors }) {
  const [showPresets, setShowPresets] = useState(false);
  const [inlineErrors, setInlineErrors] = useState({});
  const attrRefs = useRef({});

  function addAttribute() {
    const name = `Atributo ${attributes.length + 1}`;
    onChange([...attributes, { name, values: [""] }]);
    setShowPresets(false);
  }

  function addPreset(preset) {
    onChange([...attributes, { ...preset, values: [...preset.values] }]);
    setShowPresets(false);
  }

  function updateAttrName(index, name) {
    const next = attributes.map((a, i) => (i === index ? { ...a, name } : a));
    onChange(next);
  }

  function updateAttrValue(attrIndex, valIndex, value) {
    const next = attributes.map((a, i) => {
      if (i !== attrIndex) return a;
      const values = a.values.map((v, j) => (j === valIndex ? value : v));
      return { ...a, values };
    });
    onChange(next);
    setInlineErrors((prev) => {
      const next = { ...prev };
      delete next[`${attrIndex}-${valIndex}`];
      return next;
    });
  }

  function addValue(attrIndex) {
    const next = attributes.map((a, i) =>
      i === attrIndex ? { ...a, values: [...a.values, ""] } : a
    );
    onChange(next);
  }

  function removeValue(attrIndex, valIndex) {
    const next = attributes.map((a, i) => {
      if (i !== attrIndex) return a;
      const values = a.values.filter((_, j) => j !== valIndex);
      return { ...a, values };
    });
    onChange(next);
    setInlineErrors((prev) => {
      const next = { ...prev };
      delete next[`${attrIndex}-${valIndex}`];
      return next;
    });
  }

  function removeAttribute(index) {
    onChange(attributes.filter((_, i) => i !== index));
    setInlineErrors((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (k.startsWith(`${index}-`)) delete next[k];
      });
      return next;
    });
  }

  function handleValueBlur(attrIndex, valIndex) {
    const attr = attributes[attrIndex];
    if (!attr) return;
    const rawValue = attr.values[valIndex];
    const trimmed = sanitizeText(rawValue);

    if (!trimmed) {
      const otherValues = attr.values.filter((_, j) => j !== valIndex);
      const hasNonEmpty = otherValues.some((v) => v.trim());
      if (hasNonEmpty) {
        removeValue(attrIndex, valIndex);
      }
      return;
    }

    if (trimmed !== rawValue) {
      updateAttrValue(attrIndex, valIndex, trimmed);
    }

    const isDuplicate = attr.values.some(
      (v, j) => j !== valIndex && v.trim().toLowerCase() === trimmed.toLowerCase()
    );

    if (isDuplicate) {
      setInlineErrors((prev) => ({
        ...prev,
        [`${attrIndex}-${valIndex}`]: "Este valor ya fue agregado.",
      }));
    } else {
      setInlineErrors((prev) => {
        const next = { ...prev };
        delete next[`${attrIndex}-${valIndex}`];
        return next;
      });
    }
  }

  useEffect(() => {
    if (errors) {
      const keys = Object.keys(errors);
      if (keys.length > 0) {
        const firstErrorIndex = keys[0];
        const el = attrRefs.current[firstErrorIndex];
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [errors]);

  return (
    <div className="space-y-4">
      {attributes.map((attr, i) => {
        const attrError = errors?.[i];
        const hasEmpty = !(attr.values || []).some((v) => v.trim());
        return (
        <div
          key={i}
          ref={(el) => { attrRefs.current[i] = el; }}
          className={`rounded-lg border p-4 ${
            attrError
              ? "border-red-300 bg-red-50/50"
              : "border-gray-200 bg-gray-50/50"
          }`}
        >
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={attr.name}
              onChange={(e) => updateAttrName(i, e.target.value)}
              className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Nombre del atributo"
            />
            <button
              type="button"
              onClick={() => removeAttribute(i)}
              className="rounded-lg p-2 text-gray-400 hover:text-red-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {attr.values.map((val, j) => {
              const valueError = inlineErrors[`${i}-${j}`];
              return (
              <div key={j} className="flex items-center gap-1">
                <div className="relative">
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => updateAttrValue(i, j, e.target.value)}
                    onBlur={() => handleValueBlur(i, j)}
                    className={`w-24 rounded-lg border px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 ${
                      valueError
                        ? "border-red-300 focus:border-red-400 focus:ring-red/20"
                        : "border-gray-200 focus:border-primary focus:ring-primary/20"
                    }`}
                    placeholder="Valor"
                  />
                  {valueError && (
                    <p className="absolute left-0 top-full mt-0.5 w-40 text-xs text-red-500">
                      {valueError}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeValue(i, j)}
                  className="rounded p-0.5 text-gray-400 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )})}
            <button
              type="button"
              onClick={() => addValue(i)}
              className="inline-flex items-center gap-1 rounded-lg border border-dashed border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:border-primary hover:text-primary"
            >
              <Plus className="h-3 w-3" />
              Agregar valor
            </button>
          </div>

          {(attrError || hasEmpty) && (
            <p className="mt-2 text-xs text-red-500">
              {attrError || "Agrega al menos un valor o elimina este atributo."}
            </p>
          )}
        </div>
      )})}

      <div className="relative">
        <button
          type="button"
          onClick={() => setShowPresets(!showPresets)}
          className="inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:border-primary hover:text-primary"
        >
          <Plus className="h-4 w-4" />
          Agregar atributo
        </button>

        {showPresets && (
          <div className="absolute left-0 top-full z-10 mt-2 w-64 rounded-xl bg-white p-2 shadow-lg ring-1 ring-gray-200">
            <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Predefinidos
            </p>
            {PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => addPreset(p)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-primary-light hover:text-primary"
              >
                <Plus className="h-3.5 w-3.5" />
                {p.name}
              </button>
            ))}
            <div className="my-1 border-t border-gray-100" />
            <button
              type="button"
              onClick={addAttribute}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-primary-light hover:text-primary"
            >
              <Plus className="h-3.5 w-3.5" />
              Atributo personalizado
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
