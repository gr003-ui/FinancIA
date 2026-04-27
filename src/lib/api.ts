export async function getDolarBlue(): Promise<{ venta: number; compra: number }> {
  try {
    const res = await fetch('https://dolarapi.com/v1/dolares/blue');
    const data = await res.json();
    return data as { venta: number; compra: number };
  } catch (error) {
    console.error('Error al traer el dólar:', error);
    return { venta: 0, compra: 0 };
  }
}