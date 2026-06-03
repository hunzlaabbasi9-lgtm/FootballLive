import express from "express";
import Stripe from "stripe";
import { updateUser, findUserById, publicUser } from "../store.js";
import { requireAuth, signToken } from "../middleware.js";

const router = express.Router();

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || "";
const PRICE_CENTS = parseInt(process.env.ACCESS_PRICE_CENTS || "500", 10);
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const stripe = STRIPE_SECRET ? new Stripe(STRIPE_SECRET) : null;

export const STRIPE_ENABLED = Boolean(stripe);

// Create a checkout session. In mock mode (no Stripe key) we return a fake
// session id and a URL that points straight at the client success page so the
// whole flow is testable offline.
router.post("/create-checkout-session", requireAuth, async (req, res) => {
  if (req.user.hasPaid) return res.status(400).json({ error: "Already have access" });

  if (!stripe) {
    const fakeId = "mock_" + Date.now();
    return res.json({
      mock: true,
      sessionId: fakeId,
      url: `${CLIENT_URL}/payment/success?session_id=${fakeId}`,
    });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: req.user.email,
      client_reference_id: req.user.id,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: PRICE_CENTS,
            product_data: {
              name: "World Cup Live Streaming — Full Access",
              description: "Unlimited live football streaming across 50+ leagues.",
            },
          },
        },
      ],
      success_url: `${CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${CLIENT_URL}/paywall?canceled=1`,
    });
    await updateUser(req.user.id, { stripeSessionId: session.id });
    res.json({ mock: false, sessionId: session.id, url: session.url });
  } catch (err) {
    console.error("Stripe error:", err.message);
    res.status(500).json({ error: "Could not start checkout" });
  }
});

// Confirm payment when the user returns from checkout. Verifies the session
// with Stripe (or accepts the mock id) and flips the user to paid.
router.post("/confirm", requireAuth, async (req, res) => {
  const { sessionId } = req.body || {};
  if (!sessionId) return res.status(400).json({ error: "sessionId required" });

  // Mock mode
  if (!stripe || sessionId.startsWith("mock_")) {
    const user = await updateUser(req.user.id, { hasPaid: true });
    return res.json({ paid: true, mock: true, user: publicUser(user), token: signToken(user) });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid = session.payment_status === "paid";
    if (!paid) return res.status(402).json({ paid: false, error: "Payment not completed" });
    // Make sure this session belongs to the requesting user.
    if (session.client_reference_id && session.client_reference_id !== req.user.id) {
      return res.status(403).json({ error: "Session does not belong to this user" });
    }
    const user = await updateUser(req.user.id, { hasPaid: true, stripeSessionId: sessionId });
    res.json({ paid: true, user: publicUser(user), token: signToken(user) });
  } catch (err) {
    console.error("Stripe verify error:", err.message);
    res.status(500).json({ error: "Could not verify payment" });
  }
});

// Exposes pricing + mode so the client can render the right copy.
router.get("/config", (req, res) => {
  res.json({ priceCents: PRICE_CENTS, currency: "usd", stripeEnabled: STRIPE_ENABLED });
});

export default router;
