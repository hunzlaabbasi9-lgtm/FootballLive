import express from "express";
import crypto from "crypto";
import { updateUser, findUserById, publicUser } from "../store.js";
import { requireAuth, signToken } from "../middleware.js";

const router = express.Router();

const API_KEY = process.env.NOWPAYMENTS_API_KEY || "";
const IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET || "";
const PRICE_CENTS = parseInt(process.env.ACCESS_PRICE_CENTS || "500", 10);
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const SERVER_URL = (process.env.PUBLIC_SERVER_URL || "").replace(/\/$/, "");
const PAY_CURRENCY = process.env.PAY_CURRENCY || "usdtbsc"; // USDT on BNB Smart Chain (BEP-20)
const NP = "https://api.nowpayments.io/v1";

export const CRYPTO_ENABLED = Boolean(API_KEY);
const PRICE_USD = PRICE_CENTS / 100; // 5.00 -> ~5 USDT (USDT ≈ $1)

// Recursively key-sort an object so the IPN signature matches NOWPayments'.
function sortObject(obj) {
  if (Array.isArray(obj)) return obj;
  if (obj && typeof obj === "object") {
    return Object.keys(obj)
      .sort()
      .reduce((acc, k) => {
        acc[k] = sortObject(obj[k]);
        return acc;
      }, {});
  }
  return obj;
}

// Create a hosted USDT invoice and return its checkout URL.
router.post("/create-checkout-session", requireAuth, async (req, res) => {
  if (req.user.hasPaid) return res.status(400).json({ error: "Already have access" });

  // Mock mode (no API key) — lets local dev run without crypto.
  if (!API_KEY) {
    return res.json({ mock: true, url: `${CLIENT_URL}/payment/success?mock=1` });
  }

  try {
    const body = {
      price_amount: PRICE_USD,
      price_currency: "usd",
      pay_currency: PAY_CURRENCY,
      order_id: req.user.id, // used by the IPN webhook to find the user
      order_description: "WorldCup Live — Full Streaming Access",
      success_url: `${CLIENT_URL}/payment/success`,
      cancel_url: `${CLIENT_URL}/paywall?canceled=1`,
      ...(SERVER_URL ? { ipn_callback_url: `${SERVER_URL}/api/payment/ipn` } : {}),
    };
    const r = await fetch(`${NP}/invoice`, {
      method: "POST",
      headers: { "x-api-key": API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    if (!r.ok || !data.invoice_url) {
      console.error("NOWPayments invoice error:", data);
      return res.status(502).json({ error: data?.message || "Could not create crypto invoice" });
    }
    res.json({ mock: false, url: data.invoice_url });
  } catch (err) {
    console.error("Crypto checkout error:", err.message);
    res.status(500).json({ error: "Could not start checkout" });
  }
});

// IPN webhook — NOWPayments calls this when payment status changes.
router.post("/ipn", async (req, res) => {
  try {
    if (IPN_SECRET) {
      const sig = req.headers["x-nowpayments-sig"];
      const hmac = crypto.createHmac("sha512", IPN_SECRET);
      hmac.update(JSON.stringify(sortObject(req.body || {})));
      if (hmac.digest("hex") !== sig) {
        console.warn("IPN signature mismatch");
        return res.status(401).json({ error: "Invalid signature" });
      }
    }
    const { order_id, payment_status } = req.body || {};
    // Unlock once the payment is fully settled.
    if (order_id && ["finished", "confirmed"].includes(payment_status)) {
      await updateUser(order_id, { hasPaid: true });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("IPN error:", err.message);
    res.status(500).json({ error: "IPN handling failed" });
  }
});

// Polled by the success page while the on-chain payment confirms.
router.get("/status", requireAuth, (req, res) => {
  res.json({
    hasPaid: req.user.hasPaid,
    user: publicUser(req.user),
    token: req.user.hasPaid ? signToken(req.user) : undefined,
  });
});

// Mock-only confirm (used when running without an API key).
router.post("/confirm", requireAuth, async (req, res) => {
  if (API_KEY) return res.status(400).json({ error: "Use on-chain payment" });
  const user = await updateUser(req.user.id, { hasPaid: true });
  res.json({ paid: true, mock: true, user: publicUser(user), token: signToken(user) });
});

// Pricing/config for the paywall UI.
router.get("/config", (req, res) => {
  res.json({
    priceAmount: PRICE_USD,
    currency: "USDT",
    payCurrency: PAY_CURRENCY,
    cryptoEnabled: CRYPTO_ENABLED,
  });
});

export default router;
