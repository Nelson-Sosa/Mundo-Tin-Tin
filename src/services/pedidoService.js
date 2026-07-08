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
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import {
  applyStockReservationRelease,
  applyDeliveryStockUpdate,
  getProductRef,
} from "./stockUtils";
import { clearDashboardCache } from "./dashboardService";

const PEDIDOS_COLLECTION = "pedidos";
const ORDERS_COLLECTION = "orders";
const CLIENTS_COLLECTION = "clients";

// ─────────────────────────────────────────────────────────────
//  VALID STATES
// ─────────────────────────────────────────────────────────────
export const PEDIDO_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};

// ─────────────────────────────────────────────────────────────
//  CREATE PEDIDO
//  Reserves stockReservado inside a runTransaction().
//  Physical stock is NOT decremented here.
// ─────────────────────────────────────────────────────────────
export async function createPedido({
  items,
  subtotal,
  discountType,
  discountValue,
  discount,
  total,
  paymentMethod = null, // may be null until delivery
  clientId = null,
  clientName = null,
  notes = null,
  userId,
}) {
  if (!items || items.length === 0) throw new Error("EMPTY_PEDIDO");
  if (total < 0) throw new Error("NEGATIVE_TOTAL");

  const pedidosColRef = collection(db, PEDIDOS_COLLECTION);
  const pedidoDocRef = doc(pedidosColRef);

  await runTransaction(db, async (transaction) => {
    // ── Reads first (Firestore rule: all reads before any writes) ─────────
    const productRefs = items.map((item) => getProductRef(item.productId));
    const productSnaps = await Promise.all(
      productRefs.map((ref) => transaction.get(ref)),
    );

    let clientSnap = null;
    if (clientId) {
      clientSnap = await transaction.get(doc(db, CLIENTS_COLLECTION, clientId));
    }

    // ── Validate stockDisponible (stock - stockReservado) ─────────────────
    const stockErrors = [];
    for (let i = 0; i < items.length; i++) {
      const snap = productSnaps[i];
      const item = items[i];

      if (!snap.exists()) {
        throw new Error(`PRODUCT_NOT_FOUND:${item.productId}`);
      }

      const data = snap.data();
      const stock = data.stock ?? 0;
      const stockReservado = data.stockReservado ?? 0;
      const stockDisponible = stock - stockReservado;

      if (stockDisponible < item.quantity) {
        stockErrors.push({
          productId: item.productId,
          name: data.name,
          requested: item.quantity,
          disponible: stockDisponible,
        });
      }
    }

    if (stockErrors.length > 0) {
      // Encode all failing products in the error message
      const detail = stockErrors
        .map((e) => `${e.name}(disponible:${e.disponible},solicitado:${e.requested})`)
        .join("|");
      throw new Error(`INSUFFICIENT_STOCK_AVAILABLE:${detail}`);
    }

    // ── Writes: increment stockReservado for each item ────────────────────
    for (let i = 0; i < items.length; i++) {
      const data = productSnaps[i].data();
      const item = items[i];
      transaction.update(productRefs[i], {
        stockReservado: (data.stockReservado ?? 0) + item.quantity,
        updatedAt: serverTimestamp(),
        updatedBy: userId,
      });
    }

    // ── Create the pedido document ────────────────────────────────────────
    const pedidoData = {
      items: items.map(({ productId, name, sku, quantity, unitPrice, subtotal: itemSubtotal }) => ({
        productId,
        name,
        sku: sku || "",
        quantity,
        unitPrice,
        subtotal: itemSubtotal,
      })),
      subtotal,
      discountType: discountType || null,
      discountValue: discountValue || 0,
      discount: discount || 0,
      total,
      paymentMethod,
      clientId: clientId || null,
      clientName: clientName?.trim() || null,
      notes: notes?.trim() || null,
      status: PEDIDO_STATUS.PENDING,
      saleOrderId: null,
      createdAt: serverTimestamp(),
      createdBy: userId,
      updatedAt: serverTimestamp(),
      deliveredAt: null,
      deliveredBy: null,
      cancelledAt: null,
      cancelledBy: null,
      cancelReason: null,
    };

    transaction.set(pedidoDocRef, pedidoData);
  });

  return { id: pedidoDocRef.id };
}

// ─────────────────────────────────────────────────────────────
//  UPDATE STATUS — state machine
// ─────────────────────────────────────────────────────────────

/**
 * Transitions a pedido to a new status.
 *
 * pending     → in_progress : just change status
 * pending/in_progress → cancelled: release stockReservado
 * pending/in_progress → delivered: atomic delivery (see _deliverPedido)
 *
 * A pedido that is already "delivered" or "cancelled" cannot be transitioned
 * here. Use cancelOrder() in orderService to annul a delivered sale.
 */
export async function updatePedidoStatus(pedidoId, newStatus, { paymentMethod, userId } = {}) {
  if (!Object.values(PEDIDO_STATUS).includes(newStatus)) {
    throw new Error(`INVALID_STATUS:${newStatus}`);
  }

  if (newStatus === PEDIDO_STATUS.DELIVERED) {
    return _deliverPedido(pedidoId, paymentMethod, userId);
  }

  if (newStatus === PEDIDO_STATUS.CANCELLED) {
    return _cancelPedido(pedidoId, userId);
  }

  // Simple status change (pending → in_progress, etc.)
  return _changeStatus(pedidoId, newStatus, userId);
}

// ─────────────────────────────────────────────────────────────
//  INTERNAL: simple status change
// ─────────────────────────────────────────────────────────────
async function _changeStatus(pedidoId, newStatus, userId) {
  const pedidoRef = doc(db, PEDIDOS_COLLECTION, pedidoId);

  await runTransaction(db, async (transaction) => {
    const pedidoSnap = await transaction.get(pedidoRef);
    if (!pedidoSnap.exists()) throw new Error("PEDIDO_NOT_FOUND");

    const pedido = pedidoSnap.data();
    const current = pedido.status;

    if (current === PEDIDO_STATUS.DELIVERED) throw new Error("PEDIDO_ALREADY_DELIVERED");
    if (current === PEDIDO_STATUS.CANCELLED) throw new Error("PEDIDO_ALREADY_CANCELLED");

    transaction.update(pedidoRef, {
      status: newStatus,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  });

  return { id: pedidoId };
}

// ─────────────────────────────────────────────────────────────
//  INTERNAL: cancel a pedido and release stock reservation
// ─────────────────────────────────────────────────────────────
async function _cancelPedido(pedidoId, userId) {
  const pedidoRef = doc(db, PEDIDOS_COLLECTION, pedidoId);

  await runTransaction(db, async (transaction) => {
    // ── Reads ─────────────────────────────────────────────────────────────
    const pedidoSnap = await transaction.get(pedidoRef);
    if (!pedidoSnap.exists()) throw new Error("PEDIDO_NOT_FOUND");

    const pedido = pedidoSnap.data();
    if (pedido.status === PEDIDO_STATUS.DELIVERED) {
      throw new Error("PEDIDO_ALREADY_DELIVERED");
    }
    if (pedido.status === PEDIDO_STATUS.CANCELLED) {
      throw new Error("PEDIDO_ALREADY_CANCELLED");
    }

    const productRefs = (pedido.items || [])
      .filter((item) => item.productId)
      .map((item) => getProductRef(item.productId));
    const productSnaps = await Promise.all(
      productRefs.map((ref) => transaction.get(ref)),
    );

    // ── Writes ────────────────────────────────────────────────────────────
    const validItems = (pedido.items || []).filter((item) => item.productId);
    applyStockReservationRelease(transaction, productRefs, productSnaps, validItems, userId);

    transaction.update(pedidoRef, {
      status: PEDIDO_STATUS.CANCELLED,
      cancelledAt: serverTimestamp(),
      cancelledBy: userId,
      updatedAt: serverTimestamp(),
    });
  });

  return { id: pedidoId };
}

// ─────────────────────────────────────────────────────────────
//  INTERNAL: deliver a pedido (atomic)
//
//  Transaction steps (all reads before any write):
//  1. GET pedido
//  2. GET products[]    → revalidate physical stock
//  3. GET client        (optional)
//  4. UPDATE products[] → stock -= qty, stockReservado -= qty
//  5. SET orders/new    → create sale record
//  6. UPDATE pedido     → status = delivered, saleOrderId
//  7. UPDATE client     → orderCount++, totalSpent += total
// ─────────────────────────────────────────────────────────────
async function _deliverPedido(pedidoId, paymentMethod, userId) {
  if (!paymentMethod) throw new Error("MISSING_PAYMENT_METHOD");

  const pedidoRef = doc(db, PEDIDOS_COLLECTION, pedidoId);
  const newOrderRef = doc(collection(db, ORDERS_COLLECTION));

  await runTransaction(db, async (transaction) => {
    // ── Step 1: Read pedido ───────────────────────────────────────────────
    const pedidoSnap = await transaction.get(pedidoRef);
    if (!pedidoSnap.exists()) throw new Error("PEDIDO_NOT_FOUND");

    const pedido = pedidoSnap.data();
    if (pedido.status === PEDIDO_STATUS.DELIVERED) throw new Error("PEDIDO_ALREADY_DELIVERED");
    if (pedido.status === PEDIDO_STATUS.CANCELLED) throw new Error("PEDIDO_ALREADY_CANCELLED");

    // ── Step 2: Read products (revalidate physical stock) ─────────────────
    const productRefs = pedido.items.map((item) => getProductRef(item.productId));
    const productSnaps = await Promise.all(
      productRefs.map((ref) => transaction.get(ref)),
    );

    // ── Step 3: Read client (optional) ───────────────────────────────────
    let clientSnap = null;
    if (pedido.clientId) {
      clientSnap = await transaction.get(doc(db, CLIENTS_COLLECTION, pedido.clientId));
    }

    // ── Validate physical stock is still sufficient ───────────────────────
    const stockErrors = [];
    for (let i = 0; i < pedido.items.length; i++) {
      const snap = productSnaps[i];
      const item = pedido.items[i];

      if (!snap.exists()) {
        throw new Error(`PRODUCT_NOT_FOUND:${item.productId}`);
      }

      const currentStock = snap.data().stock ?? 0;
      if (currentStock < item.quantity) {
        stockErrors.push({
          productId: item.productId,
          name: snap.data().name,
          requested: item.quantity,
          available: currentStock,
        });
      }
    }

    if (stockErrors.length > 0) {
      const detail = stockErrors
        .map((e) => `${e.name}(disponible:${e.available},solicitado:${e.requested})`)
        .join("|");
      throw new Error(`INSUFFICIENT_STOCK:${detail}`);
    }

    // ── Step 4: Update products (shared utility) ─────────────────────────
    applyDeliveryStockUpdate(transaction, productRefs, productSnaps, pedido.items, userId);

    // ── Step 5: Create sale record in orders collection ───────────────────
    const resolvedPaymentMethod = paymentMethod || pedido.paymentMethod;

    transaction.set(newOrderRef, {
      items: pedido.items,
      subtotal: pedido.subtotal,
      discountType: pedido.discountType,
      discountValue: pedido.discountValue,
      discount: pedido.discount,
      total: pedido.total,
      paymentMethod: resolvedPaymentMethod,
      clientId: pedido.clientId || null,
      clientName: pedido.clientName || null,
      status: "completed",
      pedidoId: pedidoId, // back-reference so Historial can trace origin
      createdBy: userId,
      createdAt: serverTimestamp(),
    });

    // ── Step 6: Mark pedido as delivered ─────────────────────────────────
    transaction.update(pedidoRef, {
      status: PEDIDO_STATUS.DELIVERED,
      saleOrderId: newOrderRef.id,
      paymentMethod: resolvedPaymentMethod,
      deliveredAt: serverTimestamp(),
      deliveredBy: userId,
      updatedAt: serverTimestamp(),
    });

    // ── Step 7: Update client stats (identical to POS createOrder flow) ───
    if (clientSnap?.exists()) {
      const clientData = clientSnap.data();
      const clientUpdates = {
        orderCount: (clientData.orderCount || 0) + 1,
        totalSpent: (clientData.totalSpent || 0) + pedido.total,
        lastPurchaseDate: serverTimestamp(),
      };
      if (!clientData.firstPurchaseDate) {
        clientUpdates.firstPurchaseDate = serverTimestamp();
      }
      transaction.update(doc(db, CLIENTS_COLLECTION, pedido.clientId), clientUpdates);
    }
  });

  clearDashboardCache();

  return { id: pedidoId, saleOrderId: newOrderRef.id };
}

// ─────────────────────────────────────────────────────────────
//  DELETE CANCELLED PEDIDO
// ─────────────────────────────────────────────────────────────
export async function deletePedido(pedidoId) {
  const pedidoRef = doc(db, PEDIDOS_COLLECTION, pedidoId);
  const snap = await getDoc(pedidoRef);
  
  if (!snap.exists()) {
    throw new Error("PEDIDO_NOT_FOUND");
  }
  
  const pedido = snap.data();
  if (pedido.status !== PEDIDO_STATUS.CANCELLED) {
    throw new Error("ONLY_CANCELLED_CAN_BE_DELETED");
  }
  
  await deleteDoc(pedidoRef);
  return { id: pedidoId };
}

// ─────────────────────────────────────────────────────────────
//  READ helpers
// ─────────────────────────────────────────────────────────────
export async function getPedidoById(id) {
  const snap = await getDoc(doc(db, PEDIDOS_COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function getPedidos({ statusFilter = null, pageSize = 30, lastDoc = null } = {}) {
  const constraints = [];

  if (statusFilter && statusFilter !== "all") {
    constraints.push(where("status", "==", statusFilter));
  }

  constraints.push(orderBy("createdAt", "desc"));
  constraints.push(limit(pageSize + 1));
  if (lastDoc) constraints.push(startAfter(lastDoc));

  const q = query(collection(db, PEDIDOS_COLLECTION), ...constraints);
  const snapshot = await getDocs(q);

  const docs = snapshot.docs.slice(0, pageSize);
  const hasMore = snapshot.docs.length > pageSize;

  return {
    pedidos: docs.map((d) => ({ id: d.id, ...d.data() })),
    lastDoc: docs.length > 0 ? docs[docs.length - 1] : null,
    hasMore,
  };
}

export async function getPedidosSummary() {
  const q = query(
    collection(db, PEDIDOS_COLLECTION),
    where("status", "in", [PEDIDO_STATUS.PENDING, PEDIDO_STATUS.IN_PROGRESS])
  );
  const snapshot = await getDocs(q);
  const active = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

  return {
    pending: active.filter((p) => p.status === PEDIDO_STATUS.PENDING).length,
    inProgress: active.filter((p) => p.status === PEDIDO_STATUS.IN_PROGRESS).length,
    total: active.length,
  };
}
