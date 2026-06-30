import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { validateCategory, normalizeText } from "../utils/categoryValidation";

const COLLECTION = "categories";

export async function getCategories() {
  const q = query(collection(db, COLLECTION), orderBy("name", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function getCategoryById(id) {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function createCategory(data, userId) {
  const { valid, errors, sanitized } = validateCategory(data);
  if (!valid) throw new ValidationError(errors);

  const duplicate = await checkDuplicateName(sanitized.name);
  if (duplicate) throw new Error("DUPLICATE_NAME");

  const docRef = await addDoc(collection(db, COLLECTION), {
    ...sanitized,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: userId,
    updatedBy: userId,
  });

  return { id: docRef.id, ...sanitized };
}

export async function updateCategory(id, data, userId) {
  const { valid, errors, sanitized } = validateCategory(data);
  if (!valid) throw new ValidationError(errors);

  const duplicate = await checkDuplicateName(sanitized.name, id);
  if (duplicate) throw new Error("DUPLICATE_NAME");

  await updateDoc(doc(db, COLLECTION, id), {
    ...sanitized,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
}

export async function toggleCategoryStatus(id, newStatus, userId) {
  if (newStatus !== "active" && newStatus !== "inactive") {
    throw new Error("INVALID_STATUS");
  }
  await updateDoc(doc(db, COLLECTION, id), {
    status: newStatus,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
}

export async function deleteCategory(id) {
  const productsSnap = await getDocs(
    query(collection(db, "products"), where("categoryId", "==", id))
  );
  if (!productsSnap.empty) {
    throw new Error("CATEGORY_IN_USE");
  }
  await deleteDoc(doc(db, COLLECTION, id));
}

async function checkDuplicateName(name, excludeId) {
  const all = await getCategories();
  const normalized = normalizeText(name);
  const match = all.find((c) => {
    if (excludeId && c.id === excludeId) return false;
    return normalizeText(c.name) === normalized;
  });
  return !!match;
}

export class ValidationError extends Error {
  constructor(errors) {
    super("VALIDATION_ERROR");
    this.name = "ValidationError";
    this.fieldErrors = errors;
  }
}
