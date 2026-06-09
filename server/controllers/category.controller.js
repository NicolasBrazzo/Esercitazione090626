const express = require("express");

const { findAllExpenseCategories } = require("../models/expense.model");
const protect = require("../middleware/auth");

const router = express.Router();

// GET / - elenco delle categorie di spesa disponibili
router.get("/", protect, async (req, res) => {
  try {
    const categories = await findAllExpenseCategories();
    return res.status(200).json({ ok: true, categories });
  } catch (err) {
    console.error("GET ALL EXPENSE CATEGORIES ERROR:", err);
    return res.status(500).json({ ok: false, error: "Errore interno del server" });
  }
});

module.exports = router;
