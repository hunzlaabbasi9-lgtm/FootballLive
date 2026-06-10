import express from "express";
import { requireAuth, requirePaid } from "../middleware.js";
import { getWcChannels } from "../iptv.js";

const router = express.Router();

// World Cup 2026 broadcaster channels (iptv-org + official links).
router.get("/channels", requireAuth, requirePaid, async (req, res) => {
  const { region } = req.query;
  try {
    const regions = await getWcChannels({ region: region || null });
    res.json({ source: "iptv-org", regions });
  } catch (err) {
    console.error("Channels error:", err.message);
    res.status(502).json({ error: "Could not load broadcaster channels" });
  }
});

export default router;
