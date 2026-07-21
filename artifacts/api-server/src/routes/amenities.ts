import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, amenityBookingsTable, type AmenityBookingRow, type User } from "@workspace/db";
import {
  ListAmenitiesResponse,
  GetAmenityAvailabilityQueryParams,
  GetAmenityAvailabilityResponse,
  ListMyAmenityBookingsResponse,
  BookAmenityBody,
  BookAmenityResponse,
  ConfirmAmenityBookingBody,
  ConfirmAmenityBookingResponse,
} from "@workspace/api-zod";
import { getAuthedUser } from "../lib/auth";
import { AMENITIES_CATALOG, getAmenity } from "../lib/amenities-catalog";
import { stripe } from "../lib/stripe";

const router: IRouter = Router();

function toBooking(booking: AmenityBookingRow, resident: Pick<User, "name" | "flatNumber">) {
  return {
    id: booking.id,
    amenityId: booking.amenityId,
    amenityName: getAmenity(booking.amenityId)?.name ?? booking.amenityId,
    bookingDate: booking.bookingDate,
    slot: booking.slot,
    amountPaidCents: booking.amountPaidCents,
    residentName: resident.name,
    residentFlatNumber: resident.flatNumber,
    createdAt: booking.createdAt.toISOString(),
  };
}

async function findExistingBooking(amenityId: string, bookingDate: string, slot: string) {
  const [row] = await db
    .select()
    .from(amenityBookingsTable)
    .where(
      and(
        eq(amenityBookingsTable.amenityId, amenityId),
        eq(amenityBookingsTable.bookingDate, bookingDate),
        eq(amenityBookingsTable.slot, slot as AmenityBookingRow["slot"]),
      ),
    );
  return row;
}

router.get("/amenities", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }

  res.status(200).json(ListAmenitiesResponse.parse(AMENITIES_CATALOG));
});

router.get("/amenities/availability", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }

  const params = GetAmenityAvailabilityQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  if (!getAmenity(params.data.amenityId)) {
    res.status(404).json({ error: "Unknown amenity" });
    return;
  }

  const rows = await db
    .select({ slot: amenityBookingsTable.slot })
    .from(amenityBookingsTable)
    .where(
      and(
        eq(amenityBookingsTable.amenityId, params.data.amenityId),
        eq(amenityBookingsTable.bookingDate, params.data.date),
      ),
    );

  res.status(200).json(
    GetAmenityAvailabilityResponse.parse({
      date: params.data.date,
      bookedSlots: rows.map((r) => r.slot),
    }),
  );
});

router.get("/amenities/bookings/mine", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }

  const rows = await db
    .select()
    .from(amenityBookingsTable)
    .where(eq(amenityBookingsTable.residentId, user.id));

  res.status(200).json(ListMyAmenityBookingsResponse.parse(rows.map((row) => toBooking(row, user))));
});

router.post("/amenities/bookings", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }

  const parsed = BookAmenityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { amenityId, bookingDate, slot } = parsed.data;

  const amenity = getAmenity(amenityId);
  if (!amenity) {
    res.status(404).json({ error: "Unknown amenity" });
    return;
  }

  if (await findExistingBooking(amenityId, bookingDate, slot)) {
    res.status(409).json({ error: "That slot is already booked" });
    return;
  }

  if (!amenity.requiresPayment) {
    const [booking] = await db
      .insert(amenityBookingsTable)
      .values({ residentId: user.id, amenityId, bookingDate, slot, amountPaidCents: 0 })
      .returning();

    res.status(200).json(BookAmenityResponse.parse({ status: "confirmed", booking: toBooking(booking, user) }));
    return;
  }

  if (!stripe) {
    res.status(503).json({ error: "Payments aren't configured on this server yet" });
    return;
  }

  const origin =
    (typeof req.headers.origin === "string" ? req.headers.origin : undefined) ??
    process.env.PUBLIC_APP_URL ??
    "http://localhost:5173";
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: `${amenity.name} — ${bookingDate} (${slot})` },
          unit_amount: amenity.priceCents,
        },
        quantity: 1,
      },
    ],
    metadata: { residentId: String(user.id), amenityId, bookingDate, slot },
    success_url: `${origin}/amenities?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/amenities`,
  });

  res.status(200).json(BookAmenityResponse.parse({ status: "requires_payment", checkoutUrl: session.url }));
});

router.post("/amenities/bookings/confirm", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }

  const parsed = ConfirmAmenityBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (!stripe) {
    res.status(503).json({ error: "Payments aren't configured on this server yet" });
    return;
  }

  const [alreadyConfirmed] = await db
    .select()
    .from(amenityBookingsTable)
    .where(eq(amenityBookingsTable.stripeSessionId, parsed.data.sessionId));
  if (alreadyConfirmed) {
    res.status(200).json(ConfirmAmenityBookingResponse.parse(toBooking(alreadyConfirmed, user)));
    return;
  }

  const session = await stripe.checkout.sessions.retrieve(parsed.data.sessionId);

  if (session.payment_status !== "paid") {
    res.status(402).json({ error: "Payment was not completed" });
    return;
  }

  const { residentId, amenityId, bookingDate, slot } = session.metadata ?? {};
  if (!residentId || !amenityId || !bookingDate || !slot || residentId !== String(user.id)) {
    res.status(403).json({ error: "This payment session doesn't belong to you" });
    return;
  }

  const existing = await findExistingBooking(amenityId, bookingDate, slot);
  if (existing) {
    if (typeof session.payment_intent === "string") {
      await stripe.refunds.create({ payment_intent: session.payment_intent });
    }
    res.status(409).json({
      error: "That slot was booked by someone else while you were paying — you've been refunded.",
    });
    return;
  }

  const [booking] = await db
    .insert(amenityBookingsTable)
    .values({
      residentId: user.id,
      amenityId,
      bookingDate,
      slot: slot as AmenityBookingRow["slot"],
      amountPaidCents: session.amount_total ?? 0,
      stripeSessionId: parsed.data.sessionId,
    })
    .returning();

  res.status(200).json(ConfirmAmenityBookingResponse.parse(toBooking(booking, user)));
});

export default router;
