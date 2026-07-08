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
import {
  applyStockDecrement,
  applyStockReservationRelease,
  applyDeliveryStockUpdate,
  getProductRef,
} from "./stockUtils";
import { clearDashboardCache } from "./dashboardService";

const ORDERS_COLLECTION = "orders";
const PRODUCTS_COLLECTION = "products";
const CLIENTS_COLLECTION = "clients";

export async function createOrder({ items, subtotal, discountType, discountValue, discount, total, paymentMethod, clientId, clientName, userId }) {
  if (!items || items.length === 0) throw new Error("EMPTY_ORDER");
  if (!paymentMethod) throw new Error("MISSING_PAYMENT_METHOD");
  if (total < 0) throw new Error("NEGATIVE_TOTAL");

  const ordersColRef = collection(db, ORDERS_COLLECTION);
  const orderDocRef = doc(ordersColRef);

  await runTransaction(db, async (transaction) => {
    // ── Reads first (Firestore rule) ─────────────────────────────────────
    const productRefs = items.map((item) => getProductRef(item.productId));

    const productSnaps = await Promise.all(
      productRefs.map((ref) => transaction.get(ref)),
    );

    let clientSnap = null;
    if (clientId) {
      clientSnap = await transaction.get(doc(db, CLIENTS_COLLECTION, clientId));
    }

    // ── Validate stock ───────────────────────────────────────────────────
    for (let i = 0; i < items.length; i++) {
      const snap = productSnaps[i];
      const item = items[i];
      if (!snap.exists()) {
        throw new Error(`PRODUCT_NOT_FOUND:${item.productId}`);
      }
      const currentStock = snap.data().stock ?? 0;
      if (currentStock < item.quantity) {
        throw new Error(`INSUFFICIENT_STOCK:${item.productId}:${snap.data().name}`);
      }
    }

    // ── Writes ───────────────────────────────────────────────────────────
    // Shared utility — same logic used by pedidoService delivery flow
    applyStockDecrement(transaction, productRefs, productSnaps, items, userId);

    const orderData = {
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
      // POS sales never originate from a pedido
      pedidoId: null,
      createdBy: userId,
      createdAt: serverTimestamp(),
    };

    if (clientId) {
      orderData.clientId = clientId;
    }

    transaction.set(orderDocRef, orderData);

    if (clientSnap?.exists()) {
      const clientData = clientSnap.data();
      const updates = {
        orderCount: (clientData.orderCount || 0) + 1,
        totalSpent: (clientData.totalSpent || 0) + total,
        lastPurchaseDate: serverTimestamp(),
      };
      if (!clientData.firstPurchaseDate) {
        updates.firstPurchaseDate = serverTimestamp();
      }
      transaction.update(doc(db, CLIENTS_COLLECTION, clientId), updates);
    }
  });

  clearDashboardCache();

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

const PEDIDOS_COLLECTION = "pedidos";

export async function cancelOrder(orderId, userId) {
  const orderRef = doc(db, ORDERS_COLLECTION, orderId);

  await runTransaction(db, async (transaction) => {
    // ── Reads first ──────────────────────────────────────────────────────
    const orderSnap = await transaction.get(orderRef);
    if (!orderSnap.exists()) throw new Error("ORDER_NOT_FOUND");

    const order = orderSnap.data();
    const currentStatus = order.status || "completed";
    if (currentStatus === "cancelled") throw new Error("ORDER_ALREADY_CANCELLED");

    // Read product snapshots for stock restoration
    const productRefs = (order.items || [])
      .filter((item) => item.productId)
      .map((item) => getProductRef(item.productId));
    const productSnaps = await Promise.all(
      productRefs.map((ref) => transaction.get(ref)),
    );

    // Read client snapshot if present
    let clientSnap = null;
    if (order.clientId) {
      clientSnap = await transaction.get(doc(db, CLIENTS_COLLECTION, order.clientId));
    }

    // If this order originated from a pedido, read that document too
    let pedidoSnap = null;
    if (order.pedidoId) {
      pedidoSnap = await transaction.get(doc(db, PEDIDOS_COLLECTION, order.pedidoId));
    }

    // ── Writes ───────────────────────────────────────────────────────────
    // Restore physical stock for each item
    const validItems = (order.items || []).filter((item) => item.productId);
    for (let i = 0; i < productRefs.length; i++) {
      if (!productSnaps[i].exists()) continue;
      const data = productSnaps[i].data();
      const item = validItems[i];
      transaction.update(productRefs[i], {
        stock: (data.stock ?? 0) + (item.quantity || 0),
        updatedAt: serverTimestamp(),
        updatedBy: userId,
      });
    }

    // Mark order as cancelled
    transaction.update(orderRef, {
      status: "cancelled",
      cancelledAt: serverTimestamp(),
      cancelledBy: userId,
    });

    // Update client stats
    if (clientSnap?.exists()) {
      const clientData = clientSnap.data();
      transaction.update(doc(db, CLIENTS_COLLECTION, order.clientId), {
        orderCount: Math.max(0, (clientData.orderCount || 0) - 1),
        totalSpent: Math.max(0, (clientData.totalSpent || 0) - (order.total || 0)),
      });
    }

    // If this sale came from a pedido, mark the pedido as cancelled too.
    // stockReservado was already decremented when the pedido was delivered, so
    // we only need to restore physical stock (done above) and update the status.
    if (pedidoSnap?.exists()) {
      const pedidoData = pedidoSnap.data();
      // Only revert if the pedido was in delivered state (sanity check)
      if (pedidoData.status === "delivered") {
        transaction.update(doc(db, PEDIDOS_COLLECTION, order.pedidoId), {
          status: "cancelled",
          cancelledAt: serverTimestamp(),
          cancelledBy: userId,
          cancelReason: "sale_annulled",
        });
      }
    }
  });

  clearDashboardCache();

  return { id: orderId };
}
