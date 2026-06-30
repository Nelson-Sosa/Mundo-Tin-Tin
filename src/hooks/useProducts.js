import { useState, useEffect, useRef } from "react";
import * as productService from "../services/productService";

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => { mountedRef.current = false; };
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await productService.getProducts();
      if (mountedRef.current) setProducts(data);
    } catch {
      // handled by page
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  return { products, loading, reload: load };
}
