import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  try {
    const { message, history, balance, exchangeRate, transactions } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key no configurada. Agregá GEMINI_API_KEY en .env.local' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const formatM = (v: number) =>
      new Intl.NumberFormat('es-AR', {
        style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
      }).format(v);

    const systemPrompt = `Sos FinancIA, un analista financiero experto en el mercado argentino.
Contexto actual del usuario:
- Saldo neto del período: ${formatM(balance)}
- Cotización USD/ARS blue: $${exchangeRate}
- Últimos movimientos (hasta 10): ${JSON.stringify(transactions?.slice(0, 10) ?? [])}

Reglas:
- Respondé siempre en español rioplatense (vos, che, etc.)
- Sé conciso y directo — máximo 3-4 párrafos por respuesta
- Usá markdown básico: **negrita** para destacar números o conceptos clave
- Si el usuario gasta mucho en categorías no esenciales, podés ser levemente irónico pero constructivo
- Si te preguntan algo fuera de finanzas, redirigí amablemente al tema financiero
- Nunca inventes datos ni uses montos que no estén en el contexto`;

    // Construir historial en formato Gemini
    const geminiHistory = [
      {
        role: 'user' as const,
        parts: [{ text: systemPrompt }],
      },
      {
        role: 'model' as const,
        parts: [{ text: '¡Listo! Soy FinancIA, tu analista financiero. Tengo tu contexto actual cargado. ¿En qué te puedo ayudar hoy?' }],
      },
      ...history.map((m: { role: string; text: string }) => ({
        role: m.role === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: m.text }],
      })),
    ];

    const chat  = model.startChat({ history: geminiHistory });
    const result = await chat.sendMessage(message);
    const text   = result.response.text();

    return NextResponse.json({ text });
  } catch (err) {
    console.error('Gemini error:', err);
    return NextResponse.json(
      { text: 'La IA está descansando. Revisá que GEMINI_API_KEY esté en tu .env.local y reiniciá el servidor.' },
      { status: 200 }
    );
  }
}