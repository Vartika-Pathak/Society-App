import React, { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import {
  useListAmenities,
  useGetAmenityAvailability,
  useListMyAmenityBookings,
  useBookAmenity,
  useConfirmAmenityBooking,
  getGetAmenityAvailabilityQueryKey,
  getListMyAmenityBookingsQueryKey,
  getListAmenitiesQueryKey,
  type Amenity,
  type AmenityBookingSlot,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

const slotLabels: Record<AmenityBookingSlot, string> = {
  morning: "Morning (9am–12pm)",
  afternoon: "Afternoon (2pm–5pm)",
  evening: "Evening (6pm–9pm)",
};

function formatPrice(cents: number): string {
  return cents === 0 ? "Free" : `$${(cents / 100).toFixed(2)}`;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function Amenities() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const confirmedRef = useRef(false);

  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);
  const [date, setDate] = useState(todayIsoDate());
  const [slot, setSlot] = useState<AmenityBookingSlot | null>(null);

  const amenities = useListAmenities({
    query: { queryKey: getListAmenitiesQueryKey() },
  });

  const availability = useGetAmenityAvailability(
    { amenityId: selectedAmenity?.id ?? "", date },
    {
      query: {
        queryKey: getGetAmenityAvailabilityQueryKey({ amenityId: selectedAmenity?.id ?? "", date }),
        enabled: Boolean(selectedAmenity),
      },
    },
  );

  const myBookings = useListMyAmenityBookings({
    query: { queryKey: getListMyAmenityBookingsQueryKey() },
  });

  const book = useBookAmenity({
    mutation: {
      onSuccess: (result) => {
        if (result.status === "requires_payment" && result.checkoutUrl) {
          window.location.href = result.checkoutUrl;
          return;
        }
        queryClient.invalidateQueries({ queryKey: getListMyAmenityBookingsQueryKey() });
        queryClient.invalidateQueries({
          queryKey: getGetAmenityAvailabilityQueryKey({ amenityId: selectedAmenity?.id ?? "", date }),
        });
        toast({ title: "Booking confirmed", description: "Enjoy!" });
        setSlot(null);
      },
      onError: (error) => {
        toast({
          title: "Couldn't book that slot",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      },
    },
  });

  const confirm = useConfirmAmenityBooking({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMyAmenityBookingsQueryKey() });
        toast({ title: "Payment received", description: "Your booking is confirmed." });
      },
      onError: (error) => {
        toast({
          title: "We couldn't confirm that booking",
          description: error instanceof Error ? error.message : "Please contact the committee.",
          variant: "destructive",
        });
      },
    },
  });

  // Coming back from Stripe Checkout: confirm the booking once, then strip
  // the session_id out of the URL so a page refresh doesn't re-run it.
  useEffect(() => {
    if (confirmedRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (!sessionId) return;
    confirmedRef.current = true;
    confirm.mutate({ data: { sessionId } });
    params.delete("session_id");
    const newSearch = params.toString();
    window.history.replaceState({}, "", window.location.pathname + (newSearch ? `?${newSearch}` : ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bookedSlots = new Set(availability.data?.bookedSlots ?? []);

  return (
    <div className="w-full">
      <div className="bg-primary/5 py-16 border-b">
        <div className="container mx-auto px-4 md:px-8">
          <h1 className="text-3xl md:text-4xl font-serif font-medium mb-2">Amenities</h1>
          <p className="text-muted-foreground">
            Book a slot for shared amenities, with payment if the amenity requires it.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-16 max-w-3xl space-y-10">
        <div>
          <h2 className="text-lg font-serif font-medium mb-4">Choose an amenity</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {amenities.data?.map((amenity) => (
              <Card
                key={amenity.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setSelectedAmenity(amenity);
                  setSlot(null);
                }}
                className={`cursor-pointer transition-colors ${
                  selectedAmenity?.id === amenity.id ? "border-primary bg-primary/5" : "hover:border-primary/50"
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{amenity.name}</CardTitle>
                    <Badge variant={amenity.requiresPayment ? "default" : "secondary"}>
                      {formatPrice(amenity.priceCents)}
                    </Badge>
                  </div>
                  <CardDescription>{amenity.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {selectedAmenity && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Book {selectedAmenity.name}
                {selectedAmenity.requiresPayment && ` — ${formatPrice(selectedAmenity.priceCents)}`}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <input
                  id="date"
                  type="date"
                  min={todayIsoDate()}
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setSlot(null);
                  }}
                  className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label>Slot</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(Object.keys(slotLabels) as AmenityBookingSlot[]).map((s) => {
                    const taken = bookedSlots.has(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        disabled={taken || availability.isLoading}
                        onClick={() => setSlot(s)}
                        className={`rounded-lg border p-3 text-sm text-left transition-colors ${
                          taken
                            ? "opacity-40 cursor-not-allowed"
                            : slot === s
                              ? "border-primary bg-primary/5 cursor-pointer"
                              : "hover:border-primary/50 cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          {slotLabels[s]}
                          {slot === s && <Check className="h-4 w-4 text-primary" />}
                        </div>
                        {taken && <p className="text-xs text-muted-foreground mt-1">Already booked</p>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button
                className="w-full"
                disabled={!slot || book.isPending}
                onClick={() =>
                  selectedAmenity &&
                  slot &&
                  book.mutate({ data: { amenityId: selectedAmenity.id, bookingDate: date, slot } })
                }
              >
                {book.isPending
                  ? "Booking…"
                  : selectedAmenity.requiresPayment
                    ? `Book & pay ${formatPrice(selectedAmenity.priceCents)}`
                    : "Book"}
              </Button>
            </CardContent>
          </Card>
        )}

        <div>
          <h2 className="text-lg font-serif font-medium mb-4">Your bookings</h2>
          {myBookings.isLoading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : myBookings.data && myBookings.data.length > 0 ? (
            <div className="space-y-3">
              {myBookings.data.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">{booking.amenityName}</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.bookingDate} · {slotLabels[booking.slot]}
                    </p>
                  </div>
                  <Badge variant="secondary">{formatPrice(booking.amountPaidCents)}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No bookings yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
