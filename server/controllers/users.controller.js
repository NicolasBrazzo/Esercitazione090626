const express = require("express");
const bcrypt = require("bcrypt");
const { findAllUsers, findUserById } = require("../models/user.model");
const protect = require("../middleware/auth");
const { validateEmail } = require("../utils/validateEmail");
const { validatePassword } = require("../utils/validatePassword");

const router = express.Router();

// middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res
      .status(403)
      .json({ ok: false, error: "Accesso non autorizzato" });
  }
  next();
};

// Get All Users
router.get("/", protect, isAdmin, async (req, res) => {
  try {
    const users = await findAllUsers();
    return res.status(200).json({ ok: true, users });
  } catch (err) {
    console.error("GET ALL USERS ERROR:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Errore interno del server" });
  }
});

// Get single user by id
router.get("/:id", protect, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await findUserById(id);
    if (!user) {
      return res.status(404).json({ ok: false, error: "Utente non trovato" });
    }
    return res.status(200).json({ ok: true, user });
  } catch (err) {
    console.error("GET SINGLE USER BY ID ERROR:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Errore interno del server" });
  }
});

module.exports = router;
