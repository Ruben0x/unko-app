export const CURRENCIES = ["CLP", "JPY", "USD", "EUR", "GBP", "KRW", "CNY", "THB"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  CLP: "$", JPY: "¥", USD: "$", EUR: "€", GBP: "£", KRW: "₩", CNY: "¥", THB: "฿",
};

export const CURRENCY_NAMES: Record<Currency, string> = {
  CLP: "Peso Chileno",
  JPY: "Yen Japonés",
  USD: "Dólar Americano",
  EUR: "Euro",
  GBP: "Libra Esterlina",
  KRW: "Won Coreano",
  CNY: "Yuan Chino",
  THB: "Baht Tailandés",
};

export const CURRENCY_OPTIONS = CURRENCIES.map((c) => ({
  value: c,
  label: `${c} — ${CURRENCY_NAMES[c]}`,
}));
