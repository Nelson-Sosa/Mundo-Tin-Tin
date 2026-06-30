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
  runTransaction,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { uploadImage as cloudinaryUpload } from "./cloudinary";
import { deleteImage as cloudinaryDelete } from "./cloudinary";
import { validateProduct } from "../utils/productValidation";
import { getCategoryPrefix } from "../utils/skuUtils";
import { getCategories } from "./categoryService";

const COLLECTION = "products";

export async function getProducts() {
  const q = query(collection(db, COLLECTION), orderBy("name", "asc"));
  const snapshot = await getDocs(q);
  const categories = await getCategories();
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    categoryName: catMap[doc.data().categoryId] || "Sin categoría",
  }));
}

export async function getProductById(id) {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function createProduct(data, userId) {
  const categories = await getCategories();
  const { valid, errors, sanitized } = validateProduct(data, categories);
  if (!valid) throw new ValidationError(errors);

  const duplicate = await checkDuplicateInCategory(sanitized.name, sanitized.categoryId);
  if (duplicate) throw new Error("DUPLICATE_PRODUCT");

  if (sanitized.sku) {
    const skuExists = await checkSkuExists(sanitized.sku);
    if (skuExists) throw new Error("DUPLICATE_SKU");
  }

  const docRef = await addDoc(collection(db, COLLECTION), {
    ...sanitized,
    images: data.images || [],
    attributes: data.attributes || [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: userId,
    updatedBy: userId,
  });

  return { id: docRef.id, ...sanitized };
}

export async function updateProduct(id, data, userId) {
  const categories = await getCategories();
  const { valid, errors, sanitized } = validateProduct(data, categories);
  if (!valid) throw new ValidationError(errors);

  const duplicate = await checkDuplicateInCategory(sanitized.name, sanitized.categoryId, id);
  if (duplicate) throw new Error("DUPLICATE_PRODUCT");

  if (sanitized.sku) {
    const skuExists = await checkSkuExists(sanitized.sku, id);
    if (skuExists) throw new Error("DUPLICATE_SKU");
  }

  await updateDoc(doc(db, COLLECTION, id), {
    ...sanitized,
    images: data.images || [],
    attributes: data.attributes || [],
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
}

export async function toggleProductStatus(id, newStatus, userId) {
  if (newStatus !== "active" && newStatus !== "inactive") {
    throw new Error("INVALID_STATUS");
  }
  await updateDoc(doc(db, COLLECTION, id), {
    status: newStatus,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
}

export async function duplicateProduct(id, userId) {
  const original = await getProductById(id);
  if (!original) throw new Error("NOT_FOUND");

  const {
    name,
    description,
    categoryId,
    sku,
    purchasePrice,
    salePrice,
    minimumStock,
    images,
    attributes,
  } = original;

  let newName = name + " (copia)";
  let counter = 1;
  while (await checkDuplicateInCategory(newName, categoryId)) {
    counter++;
    newName = `${name} (copia ${counter})`;
  }

  const docRef = await addDoc(collection(db, COLLECTION), {
    name: newName,
    description: description || "",
    categoryId,
    sku: sku ? sku + "-COPY" : "",
    purchasePrice,
    salePrice,
    stock: 0,
    minimumStock,
    status: "inactive",
    images: images || [],
    attributes: attributes || [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: userId,
    updatedBy: userId,
  });

  return { id: docRef.id };
}

export async function deleteProduct(id) {
  const product = await getProductById(id);
  if (product?.images?.length) {
    await Promise.allSettled(
      product.images.map(async (img) => {
        const publicId = typeof img === "object" && img?.publicId ? img.publicId : null;
        if (publicId) {
          try {
            await cloudinaryDelete(publicId);
          } catch {
            // backend de eliminación aún no implementado
          }
        }
      })
    );
  }
  await deleteDoc(doc(db, COLLECTION, id));
}

export async function checkStockAvailability(productId, quantity) {
  const product = await getProductById(productId);
  if (!product) throw new Error("PRODUCT_NOT_FOUND");
  if (product.stock < quantity) throw new Error("INSUFFICIENT_STOCK");
  return true;
}

export async function decrementStock(productId, quantity, userId) {
  if (quantity <= 0) throw new Error("INVALID_QUANTITY");

  const productRef = doc(db, COLLECTION, productId);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(productRef);
    if (!snap.exists()) throw new Error("PRODUCT_NOT_FOUND");

    const currentStock = snap.data().stock ?? 0;
    if (currentStock < quantity) throw new Error("INSUFFICIENT_STOCK");

    transaction.update(productRef, {
      stock: currentStock - quantity,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  });
}

export async function uploadImage(file) {
  return cloudinaryUpload(file);
}

export async function deleteImage(publicId) {
  return cloudinaryDelete(publicId);
}

export async function getNextSkuNumber(prefix) {
  const q = query(
    collection(db, COLLECTION),
    where("sku", ">=", `${prefix}-`),
    where("sku", "<", `${prefix}-\uffff`)
  );
  const snapshot = await getDocs(q);
  let max = 0;
  snapshot.docs.forEach((doc) => {
    const sku = doc.data().sku || "";
    const parts = sku.split("-");
    const num = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(num) && num > max) max = num;
  });
  return max + 1;
}

export async function generateSku(categoryName) {
  const prefix = getCategoryPrefix(categoryName);
  const nextNum = await getNextSkuNumber(prefix);
  return `${prefix}-${String(nextNum).padStart(4, "0")}`;
}

async function checkDuplicateInCategory(name, categoryId, excludeId) {
  const q = query(
    collection(db, COLLECTION),
    where("categoryId", "==", categoryId)
  );
  const snapshot = await getDocs(q);
  const normalized = name.toLowerCase().trim();
  return snapshot.docs.some((d) => {
    if (excludeId && d.id === excludeId) return false;
    return (d.data().name || "").toLowerCase().trim() === normalized;
  });
}

async function checkSkuExists(sku, excludeId) {
  const q = query(collection(db, COLLECTION), where("sku", "==", sku));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return false;
  if (excludeId) return snapshot.docs.some((d) => d.id !== excludeId);
  return true;
}

export class ValidationError extends Error {
  constructor(errors) {
    super("VALIDATION_ERROR");
    this.name = "ValidationError";
    this.fieldErrors = errors;
  }
}
