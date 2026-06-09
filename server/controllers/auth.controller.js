const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { findUserByEmail, createNewUser } = require("../models/user.model");
const { validateEmail } = require("../utils/validateEmail");
const { validatePassword } = require("../utils/validatePassword");
const { validateName } = require("../utils/validateName");
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
        name: user.name,
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

router.post("/register", async (req, res) => {
  try {
    const { name, surname, email, password, repeatPassword, isAdmin } = req.body;

    // Validazione nome e cognome
    const nameErrors = validateName(name, "Il nome");
    if (nameErrors.length > 0) {
      return res.status(400).json({
        ok: false,
        error: nameErrors,
      });
    }
    const surnameErrors = validateName(surname, "Il cognome");
    if (surnameErrors.length > 0) {
      return res.status(400).json({
        ok: false,
        error: surnameErrors,
      });
    }

    // Validazione email
    if (!validateEmail(email)) {
      return res.status(400).json({
        ok: false,
        error: "Formato email non valido: deve essere nel formato testo@dominio.tld",
      });
    }

    // Validazione password
    const passwordErrors = validatePassword(password);
    const repeatPasswordErrors = validatePassword(repeatPassword);
    if (passwordErrors.length > 0) {
      return res.status(400).json({
        ok: false,
        error: passwordErrors,
      });
    }
    if(repeatPasswordErrors.length > 0) {
      return res.status(400).json({
        ok: false,
        error: repeatPasswordErrors,
      });
    }

    // Controllo seconda password   
    if (password !== repeatPassword) {
      return res.status(400).json({
        ok: false,
        error: "Le password non corrispondono",
      });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        ok: false,
        error: "Email già in uso",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await createNewUser(name.trim(), surname.trim(), email, hashedPassword, isAdmin);

    const token = jwt.sign(
      {
        sub: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(201).json({ ok: true, token, user });
  } catch (err) {
    console.error("CREATE USER ERROR:", err);
    return res.status(500).json({ ok: false, error: "Errore interno del server" });
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
