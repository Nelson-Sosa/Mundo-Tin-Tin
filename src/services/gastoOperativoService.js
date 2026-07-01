import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const COLLECTION = "gastos_operativos";

export function validateGasto(data) {
  const errors = {};

  const nombre = (data.nombreGasto || "").trim();
  if (!nombre) errors.nombreGasto = "El nombre del gasto es obligatorio";

  const monto = Number(data.monto);
  if (!data.monto || isNaN(monto) || monto <= 0) errors.monto = "El monto debe ser un número positivo";

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    sanitized: {
      nombreGasto: nombre,
      monto: Math.round(monto),
      fecha: data.fecha || new Date(),
    },
  };
}

export async function createGasto(data) {
  const { valid, errors, sanitized } = validateGasto(data);
  if (!valid) throw new Error("VALIDATION_ERROR");

  const docRef = await addDoc(collection(db, COLLECTION), {
    nombreGasto: sanitized.nombreGasto,
    monto: sanitized.monto,
    fecha: Timestamp.fromDate(new Date(sanitized.fecha)),
    createdAt: Timestamp.fromDate(new Date()),
  });

  return { id: docRef.id };
}

export async function getGastos() {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

export async function getGastosDelDia() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const q = query(
    collection(db, COLLECTION),
    where("fecha", ">=", Timestamp.fromDate(startOfDay)),
    orderBy("fecha", "desc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}
