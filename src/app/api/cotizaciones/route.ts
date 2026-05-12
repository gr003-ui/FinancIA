// src/app/api/cotizaciones/route.ts
// Cotizaciones en tiempo real desde bluelytics.com.ar (API pública, sin key)
// Cache de 30 minutos para no hacer demasiadas requests

import { NextResponse } from 'next/server';

export const revalidate = 1800; // 30 minutos de cache en Vercel

type BluelyticsResponse = {
  oficial:      { value_buy: number; value_sell: number };
  blue:         { value_buy: number; value_sell: number };
  oficial_euro: { value_buy: number; value_sell: number };
  blue_euro:    { value_buy: number; value_sell: number };
  last_update:  string;
};

type DolarApiResponse = {
  compra: number;
  venta:  number;
  casa:   string;
  nombre: string;
  moneda: string;
  fechaActualizacion: string;
};

export type CotizacionesData = {
  blue:     { compra: number; venta: number };
  oficial:  { compra: number; venta: number };
  mep:      { compra: number; venta: number };
  crypto:   { compra: number; venta: number };
  tarjeta:  { compra: number; venta: number };
  mayorista:{ compra: number; venta: number };
  lastUpdate: string;
  source: string;
};

async function fetchBluelytics(): Promise<CotizacionesData | null> {
  try {
    const res = await fetch('https://api.bluelytics.com.ar/v2/latest', {
      next: { revalidate: 1800 },
    });
    if (!res.ok) return null;
    const data: BluelyticsResponse = await res.json();
    return {
      blue:      { compra: data.blue.value_buy,    venta: data.blue.value_sell    },
      oficial:   { compra: data.oficial.value_buy, venta: data.oficial.value_sell },
      mep:       { compra: data.oficial.value_buy, venta: data.oficial.value_sell },
      crypto:    { compra: data.blue.value_buy,    venta: data.blue.value_sell    },
      tarjeta:   { compra: Math.round(data.oficial.value_sell * 1.6), venta: Math.round(data.oficial.value_sell * 1.6) },
      mayorista: { compra: data.oficial.value_buy, venta: data.oficial.value_sell },
      lastUpdate: data.last_update,
      source: 'bluelytics',
    };
  } catch {
    return null;
  }
}

async function fetchDolarApi(): Promise<CotizacionesData | null> {
  try {
    const endpoints = ['blue', 'oficial', 'bolsa', 'cripto', 'tarjeta', 'mayorista'];
    const results = await Promise.allSettled(
      endpoints.map((tipo) =>
        fetch(`https://dolarapi.com/v1/dolares/${tipo}`, {
          next: { revalidate: 1800 },
        }).then((r) => r.json() as Promise<DolarApiResponse>)
      )
    );

    const get = (i: number): { compra: number; venta: number } => {
      const r = results[i];
      if (r.status === 'fulfilled') return { compra: r.value.compra, venta: r.value.venta };
      return { compra: 0, venta: 0 };
    };

    // blue=0, oficial=1, bolsa(mep)=2, cripto=3, tarjeta=4, mayorista=5
    const blue = get(0);
    if (!blue.venta) return null;

    return {
      blue,
      oficial:   get(1),
      mep:       get(2),
      crypto:    get(3),
      tarjeta:   get(4),
      mayorista: get(5),
      lastUpdate: new Date().toISOString(),
      source: 'dolarapi',
    };
  } catch {
    return null;
  }
}

export async function GET() {
  // Intentamos dolarapi primero, fallback a bluelytics
  let data = await fetchDolarApi();
  if (!data) data = await fetchBluelytics();

  if (!data) {
    return NextResponse.json(
      { error: 'No se pudieron obtener cotizaciones' },
      { status: 503 }
    );
  }

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
    },
  });
}