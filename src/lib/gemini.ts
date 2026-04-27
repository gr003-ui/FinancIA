import { GoogleGenerativeAI, Content } from '@google/generative-ai';
import { Transaction } from '../store/useFinanceStore';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export type ChatMessage = {
  role: 'user' | 'model';
  text: string;
};

const buildSystemContext = (
  balance: number,
  exchangeRate: number,
  transactions: Transaction[]
): string => {
  const formatM = (v: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(v);

  return `Sos FinancIA, un analista financiero experto en el mercado argentino con humor irónico.
Contexto actual del usuario:
- Saldo neto: ${formatM(balance)}
- Cotización USD/ARS: $${exchangeRate}
- Últimos movimientos: ${JSON.stringify(transactions.slice(0, 10), null, 2)}
Respondé siempre en español, de forma concisa y práctica.
Usá formato markdown básico (negritas con **, listas con -) para organizar las respuestas largas.
Sé directo. Si el usuario gasta mucho en cosas no esenciales, podés ser levemente sarcástico pero constructivo.`;
};

export async function sendChatMessage(
  userMessage: string,
  history: ChatMessage[],
  transactions: Transaction[],
  balance: number,
  exchangeRate: number
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Historial previo en formato Gemini, con el contexto del sistema al inicio
    const geminiHistory: Content[] = [
      {
        role: 'user',
        parts: [{ text: buildSystemContext(balance, exchangeRate, transactions) }],
      },
      {
        role: 'model',
        parts: [{ text: 'Entendido. Soy FinancIA, tu analista financiero. ¿En qué te puedo ayudar hoy?' }],
      },
      ...history.map((m): Content => ({
        role: m.role,
        parts: [{ text: m.text }],
      })),
    ];

    const chat = model.startChat({ history: geminiHistory });
    const result = await chat.sendMessage(userMessage);
    return result.response.text();
  } catch (error) {
    console.error('Gemini error:', error);
    return 'La IA está descansando, pero seguí cuidando el mango.';
  }
}

// Compatibilidad con llamadas anteriores
export async function getIAAdvice(
  transactions: Transaction[],
  balance: number,
  exchangeRate: number
): Promise<string> {
  return sendChatMessage(
    'Hacé un análisis completo de mi situación financiera actual y dame recomendaciones concretas.',
    [],
    transactions,
    balance,
    exchangeRate
  );
}