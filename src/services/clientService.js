import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  where,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const CLIENTS_COLLECTION = "clients";

const PHONE_REGEX = /^[+]?[\d\s()-]{6,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class ValidationError extends Error {
  constructor(errors) {
    super("VALIDATION_ERROR");
    this.errors = errors;
  }
}

function sanitize(str) {
  return (str || "").trim().replace(/\s+/g, " ");
}

export function validateClient(data) {
  const errors = {};

  const name = sanitize(data.name);
  if (!name) errors.name = "El nombre es obligatorio";
  else if (name.length < 2) errors.name = "El nombre debe tener al menos 2 caracteres";
  else if (name.length > 100) errors.name = "El nombre no puede superar los 100 caracteres";

  const phone = sanitize(data.phone);
  if (!phone) errors.phone = "El teléfono es obligatorio";
  else if (!PHONE_REGEX.test(phone)) errors.phone = "Formato de teléfono inválido";

  const email = sanitize(data.email);
  if (email && !EMAIL_REGEX.test(email)) errors.email = "Formato de correo inválido";

  const address = sanitize(data.address);
  const notes = sanitize(data.notes);

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    sanitized: { name, phone, email, address, notes },
  };
}

export async function createClient(data, userId) {
  const { valid, errors, sanitized } = validateClient(data);
  if (!valid) throw new ValidationError(errors);

  const docRef = await addDoc(collection(db, CLIENTS_COLLECTION), {
    ...sanitized,
    orderCount: 0,
    totalSpent: 0,
    firstPurchaseDate: null,
    lastPurchaseDate: null,
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { id: docRef.id };
}

export async function updateClient(id, data, userId) {
  const { valid, errors, sanitized } = validateClient(data);
  if (!valid) throw new ValidationError(errors);

  await updateDoc(doc(db, CLIENTS_COLLECTION, id), {
    ...sanitized,
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  });

  return { id };
}

export async function getClients() {
  const q = query(collection(db, CLIENTS_COLLECTION), orderBy("name", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

export async function getClientById(id) {
  const snap = await getDoc(doc(db, CLIENTS_COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function getClientOrders(clientId) {
  const q = query(
    collection(db, "orders"),
    where("clientId", "==", clientId),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}
