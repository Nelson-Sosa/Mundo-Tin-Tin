import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const ORDERS_COLLECTION = "orders";
const PRODUCTS_COLLECTION = "products";
const GASTOS_COLLECTION = "gastos_operativos";

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

async function fetchOrdersSince(since) {
  const q = query(
    collection(db, ORDERS_COLLECTION),
    where("createdAt", ">=", Timestamp.fromDate(since)),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function fetchGastosSince(since) {
  const q = query(
    collection(db, GASTOS_COLLECTION),
    where("fecha", ">=", Timestamp.fromDate(since)),
    orderBy("fecha", "desc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function fetchAllProducts() {
  const snapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function fetchRecentOrders(limitCount = 10) {
  const q = query(
    collection(db, ORDERS_COLLECTION),
    orderBy("createdAt", "desc"),
    limit(limitCount),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

function filterActive(orders) {
  return orders.filter((o) => (o.status || "completed") !== "cancelled");
}

export async function getDashboardData() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const monthStart = startOfMonth(now);

  const [monthOrders, todayOrders, monthGastos, todayGastos, allProducts, recentOrders] =
    await Promise.all([
      fetchOrdersSince(monthStart),
      fetchOrdersSince(todayStart),
      fetchGastosSince(monthStart),
      fetchGastosSince(todayStart),
      fetchAllProducts(),
      fetchRecentOrders(10),
    ]);

  const activeMonthOrders = filterActive(monthOrders);
  const activeTodayOrders = filterActive(todayOrders);

  const ventasDiaTotal = activeTodayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const ventasMesTotal = activeMonthOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  const productosVendidos = activeMonthOrders.reduce((sum, o) => {
    return sum + (o.items || []).reduce((s, item) => s + (item.quantity || 0), 0);
  }, 0);

  const gastosDia = todayGastos.reduce((sum, g) => sum + (g.monto || 0), 0);
  const gastosMes = monthGastos.reduce((sum, g) => sum + (g.monto || 0), 0);

  const productMap = {};
  for (const p of allProducts) {
    productMap[p.id] = p.purchasePrice || 0;
  }

  let costosMes = 0;
  for (const order of activeMonthOrders) {
    for (const item of order.items || []) {
      const cost = productMap[item.productId] || 0;
      costosMes += cost * (item.quantity || 0);
    }
  }

  const ganancias = ventasMesTotal - gastosMes - costosMes;

  const stockBajo = allProducts.filter((p) => p.stock > 0 && p.stock <= (p.minimumStock || 5)).length;
  const agotados = allProducts.filter((p) => p.stock <= 0).length;

  return {
    ventasDia: { total: ventasDiaTotal, count: activeTodayOrders.length },
    ventasMes: { total: ventasMesTotal, count: activeMonthOrders.length },
    ganancias,
    gastosDia,
    gastosMes,
    productosVendidos,
    stockBajo,
    agotados,
    recentOrders,
    allProducts,
  };
}
