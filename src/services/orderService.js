import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const ORDERS_COLLECTION = "orders";
const PRODUCTS_COLLECTION = "products";

export async function createOrder({ items, subtotal, discountType, discountValue, discount, total, paymentMethod, clientName, userId }) {
  if (!items || items.length === 0) throw new Error("EMPTY_ORDER");
  if (!paymentMethod) throw new Error("MISSING_PAYMENT_METHOD");
  if (total < 0) throw new Error("NEGATIVE_TOTAL");

  const ordersColRef = collection(db, ORDERS_COLLECTION);
  const orderDocRef = doc(ordersColRef);

  await runTransaction(db, async (transaction) => {
    for (const item of items) {
      const productRef = doc(db, PRODUCTS_COLLECTION, item.productId);
      const snap = await transaction.get(productRef);

      if (!snap.exists()) {
        throw new Error(`PRODUCT_NOT_FOUND:${item.productId}`);
      }

      const currentStock = snap.data().stock ?? 0;
      if (currentStock < item.quantity) {
        throw new Error(`INSUFFICIENT_STOCK:${item.productId}:${snap.data().name}`);
      }

      transaction.update(productRef, {
        stock: currentStock - item.quantity,
        updatedAt: serverTimestamp(),
        updatedBy: userId,
      });
    }

    transaction.set(orderDocRef, {
      items: items.map(({ productId, name, sku, quantity, unitPrice, subtotal }) => ({
        productId,
        name,
        sku: sku || "",
        quantity,
        unitPrice,
        subtotal,
      })),
      subtotal,
      discountType: discountType || null,
      discountValue: discountValue || 0,
      discount: discount || 0,
      total,
      paymentMethod,
      clientName: clientName?.trim() || null,
      createdBy: userId,
      createdAt: serverTimestamp(),
    });
  });

  return { id: orderDocRef.id };
}

export async function getOrders() {
  const q = query(collection(db, ORDERS_COLLECTION), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

export async function getOrderById(id) {
  const snap = await getDoc(doc(db, ORDERS_COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}
