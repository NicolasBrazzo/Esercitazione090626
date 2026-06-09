const express = require("express");

const { findAllRefoundRequests } = require("../models/refound.model");
const { findAllExpenseCategories } = require("../models/expense.model");
const protect = require("../middleware/auth");

const router = express.Router();

// L'utente autenticato è amministratore?
const isAdmin = (req) => !!req.user?.isAdmin;

// Estrae il nome leggibile di una categoria (colonna non nota a priori)
const categoryLabel = (cat) =>
  cat?.description ?? cat?.descrizione ?? cat?.name ?? cat?.nome ?? null;

// Stati che, ai fini delle statistiche, contano come "approvati".
// Una richiesta liquidata è stata necessariamente approvata in precedenza,
// quindi rientra anche nel totale approvato (liquidato ⊆ approvato ⊆ richiesto).
const APPROVED_STATUSES = ["approvata", "liquidata"];
const SETTLED_STATUSES = ["liquidata"];

// Arrotonda a 2 decimali evitando errori di virgola mobile
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

// Estrae il mese (YYYY-MM) da una data
const monthOf = (date) => (date ? String(date).slice(0, 7) : null);

// GET / - riepilogo aggregato delle richieste di rimborso per mese e categoria.
// Riservato ai responsabili amministrativi.
//
// Filtri supportati (query string):
//   - mese       (YYYY-MM)        es. ?mese=2026-05
//   - from / to  (YYYY-MM-DD)     periodo sulla data della spesa (alternativa a mese)
//   - category_id  (alias: categoriaId)
//   - employee_id  (alias: dipendenteId)
//
// Per ogni coppia (mese, categoria) restituisce:
//   - numeroRichieste : numero di richieste presentate
//   - totaleRichiesto : totale degli importi richiesti
//   - totaleApprovato : totale degli importi approvati (approvate + liquidate)
//   - totaleLiquidato : totale degli importi liquidati
router.get("/rimborsi", protect, async (req, res) => {
  try {
    // Le statistiche sono visibili solo ai responsabili amministrativi
    if (!isAdmin(req)) {
      return res.status(403).json({
        ok: false,
        error: "Accesso non autorizzato: solo i responsabili amministrativi possono visualizzare le statistiche",
      });
    }

    // Lettura filtri (con alias in italiano come da traccia)
    const mese = req.query.mese;
    const from = req.query.from;
    const to = req.query.to;
    const category_id = req.query.category_id ?? req.query.categoriaId;
    const employee_id = req.query.employee_id ?? req.query.dipendenteId;

    // Validazione del formato del mese, se fornito
    if (mese && !/^\d{4}-\d{2}$/.test(mese)) {
      return res.status(400).json({
        ok: false,
        error: "Il parametro 'mese' deve essere nel formato YYYY-MM",
      });
    }

    // Filtri applicabili direttamente a livello di query
    const filters = {};
    if (category_id) filters.category_id = category_id;
    if (employee_id) filters.employee_id = employee_id;

    let requests = await findAllRefoundRequests(filters);

    // Filtro per mese o per periodo sulla data della spesa (lato applicativo)
    if (mese || from || to) {
      requests = requests.filter((r) => {
        if (!r.expense_date) return false;
        const day = String(r.expense_date).slice(0, 10);
        if (mese && monthOf(r.expense_date) !== mese) return false;
        if (from && day < from) return false;
        if (to && day > to) return false;
        return true;
      });
    }

    // Mappa id categoria -> nome leggibile
    const categories = await findAllExpenseCategories();
    const categoryMap = new Map(categories.map((c) => [c.id, categoryLabel(c)]));

    // Aggregazione per (mese, categoria)
    const groups = new Map();

    for (const r of requests) {
      const month = monthOf(r.expense_date);
      const catId = r.category_id ?? null;
      const key = `${month}__${catId}`;

      if (!groups.has(key)) {
        groups.set(key, {
          mese: month,
          categoriaId: catId,
          categoria: categoryMap.get(catId) ?? null,
          numeroRichieste: 0,
          totaleRichiesto: 0,
          totaleApprovato: 0,
          totaleLiquidato: 0,
        });
      }

      const group = groups.get(key);
      const amount = Number(r.amount) || 0;

      group.numeroRichieste += 1;
      group.totaleRichiesto += amount;
      if (APPROVED_STATUSES.includes(r.status)) group.totaleApprovato += amount;
      if (SETTLED_STATUSES.includes(r.status)) group.totaleLiquidato += amount;
    }

    // Arrotondamento e ordinamento (per mese, poi categoria)
    const result = Array.from(groups.values())
      .map((g) => ({
        ...g,
        totaleRichiesto: round2(g.totaleRichiesto),
        totaleApprovato: round2(g.totaleApprovato),
        totaleLiquidato: round2(g.totaleLiquidato),
      }))
      .sort((a, b) => {
        if (a.mese !== b.mese) return String(a.mese).localeCompare(String(b.mese));
        return String(a.categoria).localeCompare(String(b.categoria));
      });

    return res.status(200).json({ ok: true, stats: result });
  } catch (err) {
    console.error("GET REFUND STATS ERROR:", err);
    return res.status(500).json({ ok: false, error: "Errore interno del server" });
  }
});

module.exports = router;
