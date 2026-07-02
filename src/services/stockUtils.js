import { doc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const PRODUCTS_COLLECTION = "products";

/**
 * Applies a physical stock decrement for a list of items inside an existing
 * Firestore transaction.
 *
 * IMPORTANT: All product documents must have already been read (via
 * `transaction.get()`) before calling this function. Pass those snapshots as
 * `productSnaps` and the corresponding refs as `productRefs` in the same order
 * as `items`.
 *
 * @param {import("firebase/firestore").Transaction} transaction
 * @param {import("firebase/firestore").DocumentReference[]} productRefs
 * @param {import("firebase/firestore").DocumentSnapshot[]} productSnaps
 * @param {{ productId: string, quantity: number }[]} items
 * @param {string} userId
 */
export function applyStockDecrement(transaction, productRefs, productSnaps, items, userId) {
  for (let i = 0; i < items.length; i++) {
    const snap = productSnaps[i];
    const item = items[i];
    const currentStock = snap.data().stock ?? 0;

    transaction.update(productRefs[i], {
      stock: currentStock - item.quantity,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  }
}

/**
 * Releases the stock reservation for a list of items inside an existing
 * Firestore transaction (used when a pedido is cancelled).
 *
 * @param {import("firebase/firestore").Transaction} transaction
 * @param {{ productId: string, quantity: number }[]} items
 * @param {string} userId
 */
export async function releaseStockReservation(transaction, items, userId) {
  // Reads must be done by the caller before invoking writes — this helper
  // only handles the write side. The caller must read and pass snapshots.
  // See pedidoService.cancelPedido() for the full read-then-write pattern.
  throw new Error(
    "releaseStockReservation: use applyStockReservationRelease() with pre-read snaps instead."
  );
}

/**
 * Applies the reservation release for a list of items using pre-read snapshots.
 *
 * @param {import("firebase/firestore").Transaction} transaction
 * @param {import("firebase/firestore").DocumentReference[]} productRefs
 * @param {import("firebase/firestore").DocumentSnapshot[]} productSnaps
 * @param {{ productId: string, quantity: number }[]} items
 * @param {string} userId
 */
export function applyStockReservationRelease(transaction, productRefs, productSnaps, items, userId) {
  for (let i = 0; i < items.length; i++) {
    const snap = productSnaps[i];
    if (!snap.exists()) continue;
    const item = items[i];
    const currentReserved = snap.data().stockReservado ?? 0;

    transaction.update(productRefs[i], {
      stockReservado: Math.max(0, currentReserved - item.quantity),
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  }
}

/**
 * Applies both physical stock decrement AND reservation release atomically.
 * Used when a pedido transitions to "delivered".
 *
 * @param {import("firebase/firestore").Transaction} transaction
 * @param {import("firebase/firestore").DocumentReference[]} productRefs
 * @param {import("firebase/firestore").DocumentSnapshot[]} productSnaps
 * @param {{ productId: string, quantity: number }[]} items
 * @param {string} userId
 */
export function applyDeliveryStockUpdate(transaction, productRefs, productSnaps, items, userId) {
  for (let i = 0; i < items.length; i++) {
    const snap = productSnaps[i];
    const item = items[i];
    const data = snap.data();
    const currentStock = data.stock ?? 0;
    const currentReserved = data.stockReservado ?? 0;

    transaction.update(productRefs[i], {
      stock: currentStock - item.quantity,
      stockReservado: Math.max(0, currentReserved - item.quantity),
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  }
}

/**
 * Returns a product document reference.
 * Convenience helper so callers don't need to import `doc` and `db` directly.
 */
export function getProductRef(productId) {
  return doc(db, PRODUCTS_COLLECTION, productId);
}
