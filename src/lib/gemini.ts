import { GoogleGenerativeAI } from "@google/generative-ai";
import { Transaction } from "../store/useFinanceStore";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

export async function getIAAdvice(
  transactions: Transaction[],
  balance: number,
  exchangeRate: number
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Actúa como un experto en finanzas personales en Argentina.
      Tengo un saldo de $${balance.toFixed(2)} pesos.
      El dólar blue está a $${exchangeRate}.
      Mis últimas transacciones son: ${JSON.stringify(transactions.slice(0, 5))}.
      Dame un consejo financiero corto (máximo 2 frases) y muy concreto para hoy.
      Sé sarcástico pero útil si gasto mucho en comida o entretenimiento.
    `;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    return "La IA está descansando, pero seguí cuidando el mango.";
  }
}