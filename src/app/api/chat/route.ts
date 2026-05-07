import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { text: 'Error: GEMINI_API_KEY no está en .env.local. Agregala y reiniciá con npm run dev.' },
      { status: 200 }
    );
  }

  let body: {
    message?: string;
    history?: { role: string; text: string }[];
    balance?: number;
    exchangeRate?: number;
    transactions?: unknown[];
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ text: 'Error: body inválido.' }, { status: 400 });
  }

  const { message, history = [], balance = 0, exchangeRate = 1000, transactions = [] } = body;

  if (!message) {
    return NextResponse.json({ text: 'Error: mensaje vacío.' }, { status: 400 });
  }

  const formatM = (v: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
    }).format(v);

  const systemPrompt = `Sos FinancIA, un analista financiero experto en el mercado argentino.
Contexto actual del usuario:
- Saldo neto del período: ${formatM(balance)}
- Cotización USD/ARS blue: $${exchangeRate}
- Últimos movimientos: ${JSON.stringify(transactions.slice(0, 10))}

Respondé siempre en español rioplatense, de forma concisa (máximo 3-4 párrafos).
Usá **negrita** para resaltar números o conceptos clave.
Si el usuario gasta mucho en no esenciales, podés ser levemente irónico pero constructivo.`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const geminiHistory = [
      {
        role: 'user' as const,
        parts: [{ text: systemPrompt }],
      },
      {
        role: 'model' as const,
        parts: [{ text: 'Entendido. Soy FinancIA. ¿En qué te puedo ayudar?' }],
      },
      ...(history as { role: string; text: string }[]).map((m) => ({
        role: m.role === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: m.text }],
      })),
    ];

    const chat   = model.startChat({ history: geminiHistory });
    const result = await chat.sendMessage(message);
    const text   = result.response.text();

    return NextResponse.json({ text });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Gemini /api/chat error:', msg);

    if (msg.includes('API_KEY_INVALID') || msg.includes('PERMISSION_DENIED')) {
      return NextResponse.json({
        text: `Error: API Key inválida o sin permisos. Verificá que la key en .env.local sea correcta y reiniciá el servidor.`,
      });
    }

    if (msg.includes('RESOURCE_EXHAUSTED')) {
      return NextResponse.json({
        text: `Límite de Gemini alcanzado. Esperá unos minutos e intentá de nuevo.`,
      });
    }

    return NextResponse.json({
      text: `Error de Gemini: ${msg.slice(0, 200)}. Reiniciá el servidor con npm run dev.`,
    });
  }
}