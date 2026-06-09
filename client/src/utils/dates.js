
// Converte un mese YYYY-MM in etichetta "Maggio 2026"
export const formatMonth = (value) => {
  if (!value) return "—";
  const [year, month] = String(value).split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  if (Number.isNaN(d.getTime())) return value;
  const label = d.toLocaleDateString("it-IT", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
};