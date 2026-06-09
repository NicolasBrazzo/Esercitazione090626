import api from "../api/client";

// Riepilogo aggregato delle richieste di rimborso (solo responsabili amministrativi).
// Filtri supportati: { mese, from, to, category_id, employee_id }
export const fetchRefundStats = async (filters = {}) => {
  try {
    const res = await api.get("/statistiche/rimborsi", { params: filters });
    return res.data.stats;
  } catch (err) {
    throw new Error(err.message);
  }
};
