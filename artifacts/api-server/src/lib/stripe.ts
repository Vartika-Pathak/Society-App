import Stripe from "stripe";
import { logger } from "./logger";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  logger.warn(
    "STRIPE_SECRET_KEY is not set — booking a paid amenity will fail until it's configured. Free amenities are unaffected.",
  );
}

export const stripeEnabled = Boolean(STRIPE_SECRET_KEY);

export const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;
