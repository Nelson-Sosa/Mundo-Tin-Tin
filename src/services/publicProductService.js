import { collection, getDocs, query, orderBy, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const PRODUCTS_COLLECTION = "products";
const CATEGORIES_COLLECTION = "categories";

export async function getActiveProducts() {
  const q = query(
    collection(db, PRODUCTS_COLLECTION),
    orderBy("name", "asc")
  );
  const snapshot = await getDocs(q);

  const catSnap = await getDocs(collection(db, CATEGORIES_COLLECTION));
  const catMap = Object.fromEntries(
    catSnap.docs.map((d) => [d.id, d.data().name])
  );

  return snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
      categoryName: catMap[doc.data().categoryId] || "Sin categoría",
    }))
    .filter((p) => p.status === "active");
}

export async function getActiveProductById(id) {
  const snap = await getDoc(doc(db, PRODUCTS_COLLECTION, id));
  if (!snap.exists()) return null;
  const product = { id: snap.id, ...snap.data() };
  if (product.status !== "active") return null;

  let categoryName = "Sin categoría";
  if (product.categoryId) {
    const catSnap = await getDoc(doc(db, CATEGORIES_COLLECTION, product.categoryId));
    if (catSnap.exists()) categoryName = catSnap.data().name;
  }

  return { ...product, categoryName };
}
