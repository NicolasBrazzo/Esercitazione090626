const express = require("express");

const {
  findAllDeliveries,
  findDeliveryById,
  createDelivery,
  updateDeliveryById,
  deleteDeliveryById,
  findDeliveryByDeliveryKey,
  findDeliveryByDeliveryKeyAndCollectionDate,
} = require("../models/deliveries.model");
const protect = require("../middleware/auth");

const VALID_STATUSES = ["da_ritirare", "in_deposito", "in_consegna", "consegnato", "in_giacenza"];

const router = express.Router();

// Get All Deliveries (with filters)
router.get("/", protect, async (req, res) => {
  try {
    const { status, id_client } = req.query;

    const deliveries = await findAllDeliveries({
      status,
      client_id: id_client,
    });

    return res.status(200).json({ ok: true, deliveries });
  } catch (err) {
    console.error("GET ALL DELIVERIES ERROR:", err);
    return res.status(500).json({ ok: false, error: "Errore interno del server" });
  }
});

// Track delivery by delivery key and collection date
router.get("/track", async (req, res) => {
  try {
    const { delivery_key, collection_date } = req.query;

    if (!delivery_key || !collection_date) {
      return res.status(400).json({
        ok: false,
        error: "Campi obbligatori mancanti: chiave di consegna, data di ritiro",
      });
    }

    const track = await findDeliveryByDeliveryKeyAndCollectionDate(
      delivery_key,
      collection_date,
    );
    if (!track) {
      return res.status(404).json({ ok: false, error: "Tracciamento non trovato" });
    }
    return res.status(200).json({ ok: true, track: track });
  } catch (err) {
    console.error("TRACK DELIVERY BY DELIVERY KEY ERROR:", err);
    return res.status(500).json({ ok: false, error: "Errore interno del server" });
  }
});

// Get single delivery by id
router.get("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const delivery = await findDeliveryById(id);
    if (!delivery) {
      return res.status(404).json({ ok: false, error: "Consegna non trovata" });
    }
    return res.status(200).json({ ok: true, delivery });
  } catch (err) {
    console.error("GET SINGLE DELIVERY BY ID ERROR:", err);
    return res.status(500).json({ ok: false, error: "Errore interno del server" });
  }
}); 

// Create Delivery
router.post("/", protect, async (req, res) => {
  try {
    const { client_id, collection_date, delivery_date, status } = req.body;

    const delivery_key = Math.random().toString(36).substring(2, 15);

    if (!client_id || !collection_date || !status) {
      return res.status(400).json({
        ok: false,
        error: "Campi obbligatori mancanti: id cliente, data di ritiro, stato",
      });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        ok: false,
        error: `Stato non valido. Deve essere uno dei seguenti: ${VALID_STATUSES.join(", ")}`,
      });
    }

    if (delivery_date && new Date(delivery_date) < new Date(collection_date)) {
      return res.status(400).json({
        ok: false,
        error: "La data di consegna non può essere precedente alla data di raccolta",
      });
    }

    const existingDelivery = await findDeliveryByDeliveryKey(delivery_key);
    if (existingDelivery) {
      return res.status(409).json({
        ok: false,
        error: "Chiave di consegna già in uso",
      });
    }

    const delivery = await createDelivery(
      client_id,
      collection_date,
      delivery_date,
      delivery_key,
      status,
    );
    return res.status(201).json({ ok: true, delivery });
  } catch (err) {
    console.error("CREATE DELIVERY ERROR:", err);
    return res.status(500).json({ ok: false, error: "Errore interno del server" });
  }
});

// Update Delivery by ID
router.put("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { client_id, collection_date, delivery_date, status } = req.body;

    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        ok: false,
        error: `Stato non valido. Deve essere uno dei seguenti: ${VALID_STATUSES.join(", ")}`,
      });
    }

    if (collection_date && delivery_date && new Date(delivery_date) < new Date(collection_date)) {
      return res.status(400).json({
        ok: false,
        error: "La data di consegna non può essere precedente alla data di raccolta",
      });
    }

    const delivery = await updateDeliveryById(id, {
      client_id,
      collection_date,
      delivery_date,
      status,
    });
    return res.status(200).json({ ok: true, delivery });
  } catch (err) {
    console.error("UPDATE DELIVERY BY ID ERROR:", err);
    return res.status(500).json({ ok: false, error: "Errore interno del server" });
  }
});

// Delete Delivery by ID
router.delete("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;

    const delivery = await deleteDeliveryById(id);
    return res.status(200).json({ ok: true, delivery });
  } catch (err) {
    console.error("DELETE DELIVERY BY ID ERROR:", err);
    return res.status(500).json({ ok: false, error: "Errore interno del server" });
  }
});

module.exports = router;
