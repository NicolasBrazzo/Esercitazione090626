const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { findUserByEmail } = require("../models/user.model");
const protect = require("../middleware/auth");

const {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  SALT_ROUNDS,
} = require("../config/jwt");

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        error: "Email e password sono obbligatorie",
      });
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(401).json({
        ok: false,
        error: "Credenziali non valide",
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({
        ok: false,
        error: "Credenziali non valide",
      });
    }

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        isAdmin: user.isAdmin
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      ok: true,
      token,
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);

    return res.status(500).json({
      ok: false,
      error: "Errore interno del server",
    });
  }
});

router.get("/me", protect, (req, res) => {
  return res.json({
    ok: true,
    user: req.user,
  });
});

router.post("/logout", (req, res) => {
  return res.json({ ok: true });
});

module.exports = router;
