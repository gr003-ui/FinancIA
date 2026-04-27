export async function getDolarBlue() {
  try {
    const res = await fetch('https://dolarapi.com/v1/dolares/blue', { next: { revalidate: 3600 } });
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error al traer el dólar:", error);
    return { venta: 0, compra: 0 };
  }
}