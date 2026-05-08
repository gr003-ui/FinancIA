import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { text: 'Error: GEMINI_API_KEY no está en .env.local.', retryAfter: 0 },
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
    return NextResponse.json({ text: 'Error: body inválido.', retryAfter: 0 }, { status: 400 });
  }

  const {
    message,
    history      = [],
    balance      = 0,
    exchangeRate = 1000,
    transactions = [],
  } = body;

  if (!message) {
    return NextResponse.json({ text: 'Mensaje vacío.', retryAfter: 0 }, { status: 400 });
  }

  const formatM = (v: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
    }).format(v);

  const systemPrompt = `Sos FinancIA, un analista financiero experto en el mercado argentino.
Contexto actual:
- Saldo neto: ${formatM(balance)}
- Cotización USD/ARS: $${exchangeRate}
- Últimos movimientos: ${JSON.stringify((transactions as unknown[]).slice(0, 8))}

Reglas:
- Respondé en español rioplatense, máximo 3-4 párrafos
- Usá **negrita** para números clave
- Si gasta mucho en no esenciales, sé levemente irónico pero constructivo
- No inventes datos que no estén en el contexto`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // gemini-2.0-flash-lite: 30 RPM gratuitos (vs 15 de flash)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

    const geminiHistory = [
      { role: 'user'  as const, parts: [{ text: systemPrompt }] },
      { role: 'model' as const, parts: [{ text: 'Entendido. Soy FinancIA. ¿En qué te puedo ayudar?' }] },
      ...(history as { role: string; text: string }[]).map((m) => ({
        role:  m.role === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: m.text }],
      })),
    ];

    const chat   = model.startChat({ history: geminiHistory });
    const result = await chat.sendMessage(message);

    return NextResponse.json({ text: result.response.text(), retryAfter: 0 });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Gemini /api/chat error:', msg);

    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
      return NextResponse.json({
        text: '__QUOTA__',
        retryAfter: 60,
      });
    }
    if (msg.includes('API_KEY_INVALID') || msg.includes('PERMISSION_DENIED')) {
      return NextResponse.json({
        text: 'API Key inválida. Verificá GEMINI_API_KEY en .env.local y reiniciá el servidor.',
        retryAfter: 0,
      });
    }

    return NextResponse.json({
      text: `Error inesperado: ${msg.slice(0, 150)}`,
      retryAfter: 0,
    });
  }
}