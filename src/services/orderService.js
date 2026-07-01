import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  where,
  limit,
  startAfter,
  runTransaction,
  serverTimestamp,
  Timestamp,
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
        status: "completed",
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

export async function getOrdersWithFilters({
  dateFrom,
  dateTo,
  paymentMethod,
  clientName,
  pageSize = 20,
  lastDoc = null,
} = {}) {
  const constraints = [];

  if (dateFrom) {
    const ts = dateFrom instanceof Timestamp ? dateFrom : Timestamp.fromDate(dateFrom);
    constraints.push(where("createdAt", ">=", ts));
  }
  if (dateTo) {
    const ts = dateTo instanceof Timestamp ? dateTo : Timestamp.fromDate(dateTo);
    constraints.push(where("createdAt", "<=", ts));
  }
  if (paymentMethod && paymentMethod !== "all") {
    constraints.push(where("paymentMethod", "==", paymentMethod));
  }
  if (clientName && clientName.trim()) {
    const name = clientName.trim();
    constraints.push(where("clientName", ">=", name));
    constraints.push(where("clientName", "<", name + "\uf8ff"));
  }

  constraints.push(orderBy("createdAt", "desc"));
  constraints.push(limit(pageSize + 1));
  if (lastDoc) constraints.push(startAfter(lastDoc));

  const q = query(collection(db, ORDERS_COLLECTION), ...constraints);
  const snapshot = await getDocs(q);

  const docs = snapshot.docs.slice(0, pageSize);
  const hasMore = snapshot.docs.length > pageSize;

  return {
    orders: docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    lastDoc: docs.length > 0 ? docs[docs.length - 1] : null,
    hasMore,
  };
}

export async function getOrderSummary() {
  const now = new Date();

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const weekDay = now.getDay();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - (weekDay === 0 ? 6 : weekDay - 1));
  weekStart.setHours(0, 0, 0, 0);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthQ = query(
    collection(db, ORDERS_COLLECTION),
    where("createdAt", ">=", Timestamp.fromDate(monthStart)),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(monthQ);

  const allOrders = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const completed = allOrders.filter((o) => (o.status || "completed") !== "cancelled");

  const todayOrders = completed.filter((o) => {
    const d = o.createdAt?.toDate?.() || new Date(0);
    return d >= todayStart;
  });

  const weekOrders = completed.filter((o) => {
    const d = o.createdAt?.toDate?.() || new Date(0);
    return d >= weekStart;
  });

  return {
    today: {
      total: todayOrders.reduce((sum, o) => sum + (o.total || 0), 0),
      count: todayOrders.length,
    },
    week: {
      total: weekOrders.reduce((sum, o) => sum + (o.total || 0), 0),
    },
    month: {
      total: completed.reduce((sum, o) => sum + (o.total || 0), 0),
    },
  };
}

export async function cancelOrder(orderId, userId) {
  const orderRef = doc(db, ORDERS_COLLECTION, orderId);

  await runTransaction(db, async (transaction) => {
    const orderSnap = await transaction.get(orderRef);
    if (!orderSnap.exists()) throw new Error("ORDER_NOT_FOUND");

    const order = orderSnap.data();
    const currentStatus = order.status || "completed";
    if (currentStatus === "cancelled") throw new Error("ORDER_ALREADY_CANCELLED");

    for (const item of order.items || []) {
      if (!item.productId) continue;
      const productRef = doc(db, PRODUCTS_COLLECTION, item.productId);
      const productSnap = await transaction.get(productRef);
      if (productSnap.exists()) {
        transaction.update(productRef, {
          stock: (productSnap.data().stock ?? 0) + (item.quantity || 0),
          updatedAt: serverTimestamp(),
          updatedBy: userId,
        });
      }
    }

    transaction.update(orderRef, {
      status: "cancelled",
      cancelledAt: serverTimestamp(),
      cancelledBy: userId,
    });
  });

  return { id: orderId };
}
