const express = require("express");

const {
  findAllRefoundRequests,
  findRefoundRequestById,
  createRefoundRequest,
  updateRefoundRequestById,
  deleteRefoundRequestById,
} = require("../models/refound.model");
const { findAllExpenseCategories } = require("../models/expense.model");
const { findAllUsers } = require("../models/user.model");
const protect = require("../middleware/auth");

const router = express.Router();

const VALID_STATUSES = ["in_attesa", "approvata", "rifiutata", "liquidata"];

const isAdmin = (req) => !!req.user?.isAdmin;

// Estrae il nome leggibile di una categoria
const categoryLabel = (cat) => cat?.name ?? null;

// Aggiunge a ogni richiesta il nome della categoria e del dipendente
const enrichRequests = async (requests) => {
  const categories = await findAllExpenseCategories();
  const users = await findAllUsers();

  return requests.map((r) => {
    const category = categories.find((c) => c.id === r.category_id);
    const employee = users.find((u) => u.id === r.employee_id);

    return {
      ...r,
      category_name: category ? category.name : null,
      employee_name: employee ? `${employee.name} ${employee.surname}` : null,
    };
  });
};

// Validazione dei campi di una richiesta (POST/PUT)
const validateRequestFields = async ({
  expense_date,
  amount,
  category_id,
  description,
  receipt_reference,
}) => {
  if (!expense_date) {
    return "La data della spesa è obbligatoria";
  }

  const numericAmount = Number(amount);
  if (Number.isNaN(numericAmount) || numericAmount <= 0) {
    return "L'importo deve essere un numero maggiore di zero";
  }

  if (!category_id) {
    return "La categoria è obbligatoria";
  }

  const categories = await findAllExpenseCategories();
  const categoryExists = categories.some((c) => String(c.id) === String(category_id));
  if (!categoryExists) {
    return "La categoria selezionata non esiste";
  }

  if (!description || !description.trim()) {
    return "La descrizione della spesa è obbligatoria";
  }

  if (receipt_reference !== undefined && receipt_reference !== null && receipt_reference !== "" && !receipt_reference.trim()) {
    return "Il riferimento al giustificativo non può essere composto solo da spazi";
  }

  return null;
};

// GET / - elenco richieste con filtri
router.get("/", protect, async (req, res) => {
  try {
    const { status, category_id, from, to, employee_id, mese } = req.query;

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        ok: false,
        error: `Stato non valido. Deve essere uno dei seguenti: ${VALID_STATUSES.join(", ")}`,
      });
    }

    const filters = { status, category_id };

    // Il dipendente vede solo le proprie richieste; l'admin può filtrare per dipendente
    if (isAdmin(req)) {
      if (employee_id) filters.employee_id = employee_id;
    } else {
      filters.employee_id = req.user.sub;
    }

    let requests = await findAllRefoundRequests(filters);

    // Filtro per mese (MM) sulla data della spesa, indipendentemente dall'anno
    if (mese) {
      requests = requests.filter(
        (r) => r.expense_date && String(r.expense_date).slice(5, 7) === mese
      );
    }

    // Filtro per intervallo di date (YYYY-MM-DD) sulla data della spesa
    if (from || to) {
      requests = requests.filter((r) => {
        if (!r.expense_date) return false;
        const day = String(r.expense_date).slice(0, 10);
        if (from && day < from) return false;
        if (to && day > to) return false;
        return true;
      });
    }

    const enriched = await enrichRequests(requests);

    return res.status(200).json({ ok: true, requests: enriched });
  } catch (err) {
    console.error("GET ALL REFUND REQUESTS ERROR:", err);
    return res.status(500).json({ ok: false, error: "Errore interno del server" });
  }
});

// GET /:id - dettaglio richiesta
router.get("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const request = await findRefoundRequestById(id);

    if (!request) {
      return res.status(404).json({ ok: false, error: "Richiesta non trovata" });
    }

    // Il dipendente può vedere solo le proprie richieste
    if (!isAdmin(req) && request.employee_id !== req.user.sub) {
      return res.status(403).json({ ok: false, error: "Accesso non autorizzato" });
    }

    const [enriched] = await enrichRequests([request]);
    return res.status(200).json({ ok: true, request: enriched });
  } catch (err) {
    console.error("GET REFUND REQUEST BY ID ERROR:", err);
    return res.status(500).json({ ok: false, error: "Errore interno del server" });
  }
});

// POST / - creazione richiesta
router.post("/", protect, async (req, res) => {
  try {
    const { expense_date, category_id, amount, description, receipt_reference } = req.body;

    const validationError = await validateRequestFields({
      expense_date,
      amount,
      category_id,
      description,
      receipt_reference,
    });
    if (validationError) {
      return res.status(400).json({ ok: false, error: validationError });
    }

    const request = await createRefoundRequest(
      new Date().toISOString(), // submission_date
      expense_date,
      category_id,
      Number(amount),
      description.trim(),
      receipt_reference ? receipt_reference.trim() : null,
      "in_attesa", // status iniziale
      req.user.sub, // employee_id
      null, // evaluation_date
      null, // admin_id
      null, // rejection_reason
      null // settlement_date
    );

    return res.status(201).json({ ok: true, request });
  } catch (err) {
    console.error("CREATE REFUND REQUEST ERROR:", err);
    return res.status(500).json({ ok: false, error: "Errore interno del server" });
  }
});

// PUT /:id - modifica richiesta (solo proprietario, solo se in attesa)
router.put("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await findRefoundRequestById(id);

    if (!existing) {
      return res.status(404).json({ ok: false, error: "Richiesta non trovata" });
    }

    if (existing.employee_id !== req.user.sub) {
      return res.status(403).json({
        ok: false,
        error: "Non puoi modificare una richiesta di un altro dipendente",
      });
    }

    if (existing.status !== "in_attesa") {
      return res.status(403).json({
        ok: false,
        error: "Puoi modificare solo richieste in stato 'In attesa'",
      });
    }

    const { expense_date, category_id, amount, description, receipt_reference } = req.body;

    const validationError = await validateRequestFields({
      expense_date,
      amount,
      category_id,
      description,
      receipt_reference,
    });
    if (validationError) {
      return res.status(400).json({ ok: false, error: validationError });
    }

    const request = await updateRefoundRequestById(id, {
      expense_date,
      category_id,
      amount: Number(amount),
      description: description.trim(),
      receipt_reference: receipt_reference ? receipt_reference.trim() : null,
    });

    return res.status(200).json({ ok: true, request });
  } catch (err) {
    console.error("UPDATE REFUND REQUEST ERROR:", err);
    return res.status(500).json({ ok: false, error: "Errore interno del server" });
  }
});

// DELETE /:id - elimina richiesta (solo proprietario, solo se in attesa)
router.delete("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await findRefoundRequestById(id);

    if (!existing) {
      return res.status(404).json({ ok: false, error: "Richiesta non trovata" });
    }

    if (existing.employee_id !== req.user.sub) {
      return res.status(403).json({
        ok: false,
        error: "Non puoi eliminare una richiesta di un altro dipendente",
      });
    }

    if (existing.status !== "in_attesa") {
      return res.status(403).json({
        ok: false,
        error: "Puoi eliminare solo richieste in stato 'In attesa'",
      });
    }

    const request = await deleteRefoundRequestById(id);
    return res.status(200).json({ ok: true, request });
  } catch (err) {
    console.error("DELETE REFUND REQUEST ERROR:", err);
    return res.status(500).json({ ok: false, error: "Errore interno del server" });
  }
});

// PUT /:id/approva - approva (solo admin, solo da in_attesa)
router.put("/:id/approva", protect, async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ ok: false, error: "Accesso non autorizzato" });
    }

    const { id } = req.params;
    const existing = await findRefoundRequestById(id);

    if (!existing) {
      return res.status(404).json({ ok: false, error: "Richiesta non trovata" });
    }

    if (existing.status !== "in_attesa") {
      return res.status(409).json({
        ok: false,
        error: "Solo le richieste in stato 'In attesa' possono essere approvate",
      });
    }

    const request = await updateRefoundRequestById(id, {
      status: "approvata",
      evaluation_date: new Date().toISOString(),
      admin_id: req.user.sub,
      rejection_reason: null,
    });

    return res.status(200).json({ ok: true, request });
  } catch (err) {
    console.error("APPROVE REFUND REQUEST ERROR:", err);
    return res.status(500).json({ ok: false, error: "Errore interno del server" });
  }
});

// PUT /:id/rifiuta - rifiuta (solo admin, solo da in_attesa)
router.put("/:id/rifiuta", protect, async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ ok: false, error: "Accesso non autorizzato" });
    }

    const { id } = req.params;
    const { rejection_reason } = req.body;

    if (rejection_reason !== undefined && rejection_reason !== null && rejection_reason !== "" && !rejection_reason.trim()) {
      return res.status(400).json({
        ok: false,
        error: "La motivazione del rifiuto non può essere composta solo da spazi",
      });
    }

    const existing = await findRefoundRequestById(id);

    if (!existing) {
      return res.status(404).json({ ok: false, error: "Richiesta non trovata" });
    }

    if (existing.status !== "in_attesa") {
      return res.status(409).json({
        ok: false,
        error: "Solo le richieste in stato 'In attesa' possono essere rifiutate",
      });
    }

    const request = await updateRefoundRequestById(id, {
      status: "rifiutata",
      evaluation_date: new Date().toISOString(),
      admin_id: req.user.sub,
      rejection_reason: rejection_reason ? rejection_reason.trim() : null,
    });

    return res.status(200).json({ ok: true, request });
  } catch (err) {
    console.error("REJECT REFUND REQUEST ERROR:", err);
    return res.status(500).json({ ok: false, error: "Errore interno del server" });
  }
});

// PUT /:id/liquida - liquida (solo admin, solo da approvata)
router.put("/:id/liquida", protect, async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ ok: false, error: "Accesso non autorizzato" });
    }

    const { id } = req.params;
    const existing = await findRefoundRequestById(id);

    if (!existing) {
      return res.status(404).json({ ok: false, error: "Richiesta non trovata" });
    }

    if (existing.status !== "approvata") {
      return res.status(409).json({
        ok: false,
        error: "Solo le richieste approvate possono essere liquidate",
      });
    }

    const request = await updateRefoundRequestById(id, {
      status: "liquidata",
      settlement_date: new Date().toISOString(),
    });

    return res.status(200).json({ ok: true, request });
  } catch (err) {
    console.error("SETTLE REFUND REQUEST ERROR:", err);
    return res.status(500).json({ ok: false, error: "Errore interno del server" });
  }
});

module.exports = router;
