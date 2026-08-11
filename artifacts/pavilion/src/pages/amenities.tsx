import React, { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Trash2 } from "lucide-react";
import {
  useListAmenities,
  useGetAmenityAvailability,
  useListMyAmenityBookings,
  useBookAmenity,
  useConfirmAmenityBooking,
  useGetMyParkingPass,
  usePurchaseParkingPass,
  useConfirmParkingPass,
  useListVehicles,
  useRegisterVehicle,
  useDeleteVehicle,
  getGetAmenityAvailabilityQueryKey,
  getListMyAmenityBookingsQueryKey,
  getListAmenitiesQueryKey,
  getGetMyParkingPassQueryKey,
  getListVehiclesQueryKey,
  type Amenity,
  type AmenityBookingSlot,
  type VehicleInputVehicleType,
} from "@workspace/api-client-react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const slotLabels: Record<AmenityBookingSlot, string> = {
  morning: "Morning (9am–12pm)",
  afternoon: "Afternoon (2pm–5pm)",
  evening: "Evening (6pm–9pm)",
};

// The hour each slot ends at — keep in sync with SLOT_END_HOUR in the api-server's
// lib/amenity-slots.ts, which enforces the same cutoff server-side.
const slotEndHour: Record<AmenityBookingSlot, number> = {
  morning: 12,
  afternoon: 17,
  evening: 21,
};

const vehicleTypeLabels: Record<VehicleInputVehicleType, string> = {
  car: "Car",
  bike: "Bike",
  other: "Other",
};

function isSlotPast(dateStr: string, slot: AmenityBookingSlot): boolean {
  const slotEnd = new Date(`${dateStr}T00:00:00`);
  slotEnd.setHours(slotEndHour[slot], 0, 0, 0);
  return slotEnd.getTime() <= Date.now();
}

function formatPrice(cents: number): string {
  return cents === 0 ? "Free" : `$${(cents / 100).toFixed(2)}`;
}

function formatRupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

// Matches the backend's VehicleRequest.plateNumber pattern — kept in sync so an obviously
// invalid plate is caught before the round trip instead of just relying on the 400.
const STANDARD_PLATE_REGEX = /^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$/;
const BHARAT_PLATE_REGEX = /^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$/;

function normalizePlateInput(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

// Matches the backend's ValidationPatterns.PHONE_10_DIGIT — 10 digits, first digit 6-9.
const PHONE_REGEX = /^[6-9][0-9]{9}$/;

function normalizePhoneInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10);
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function VehicleParkingSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const confirmedParkingRef = useRef(false);

  const canManage = user?.role === "guard" || user?.role === "admin";
  const isAdmin = user?.role === "admin";

  const [plateNumber, setPlateNumber] = useState("");
  const [isBharatSeries, setIsBharatSeries] = useState(false);
  const [vehicleType, setVehicleType] = useState<VehicleInputVehicleType>("car");
  const [ownerPhone, setOwnerPhone] = useState("");

  const myPass = useGetMyParkingPass({
    query: { queryKey: getGetMyParkingPassQueryKey(), enabled: !canManage },
  });

  const vehicles = useListVehicles({ query: { queryKey: getListVehiclesQueryKey() } });

  const invalidateVehicles = () => queryClient.invalidateQueries({ queryKey: getListVehiclesQueryKey() });

  const purchasePass = usePurchaseParkingPass({
    mutation: {
      onSuccess: (result) => {
        if (result.checkoutUrl) {
          window.location.href = result.checkoutUrl;
        }
      },
      onError: (error) => {
        toast({
          title: "Couldn't start payment",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      },
    },
  });

  const confirmPass = useConfirmParkingPass({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMyParkingPassQueryKey() });
        toast({ title: "Payment received", description: "Your flat's parking pass is active — forever." });
      },
      onError: (error) => {
        toast({
          title: "We couldn't confirm your parking pass",
          description: error instanceof Error ? error.message : "Please contact the committee.",
          variant: "destructive",
        });
      },
    },
  });

  const registerVehicle = useRegisterVehicle({
    mutation: {
      onSuccess: () => {
        invalidateVehicles();
        toast({ title: "Vehicle registered" });
        setPlateNumber("");
        setOwnerPhone("");
      },
      onError: (error) => {
        toast({
          title: "Couldn't register vehicle",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      },
    },
  });

  const deleteVehicle = useDeleteVehicle({
    mutation: {
      onSuccess: () => {
        invalidateVehicles();
        toast({ title: "Vehicle removed" });
      },
      onError: () => {
        toast({ title: "Couldn't remove vehicle", description: "Please try again.", variant: "destructive" });
      },
    },
  });

  // Coming back from Stripe Checkout for a parking pass: confirm it once, then strip
  // parking_session_id out of the URL so a page refresh doesn't re-run it. Uses a distinct
  // query param from amenity bookings (session_id) so the two confirm flows can't collide.
  useEffect(() => {
    if (confirmedParkingRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("parking_session_id");
    if (!sessionId) return;
    confirmedParkingRef.current = true;
    confirmPass.mutate({ data: { sessionId } });
    params.delete("parking_session_id");
    const newSearch = params.toString();
    window.history.replaceState({}, "", window.location.pathname + (newSearch ? `?${newSearch}` : ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const expectedFormat = isBharatSeries ? BHARAT_PLATE_REGEX : STANDARD_PLATE_REGEX;
    if (!expectedFormat.test(plateNumber)) {
      toast({
        title: "That doesn't look like a valid plate number",
        description: isBharatSeries
          ? "Bharat-series plates look like 22BH1234AB — 2 digits, \"BH\", 4 digits, then 1–2 letters."
          : "Plates look like MH12AB1234 — 2 letters, 2 digits, 2 letters, then 4 digits.",
        variant: "destructive",
      });
      return;
    }
    if (!PHONE_REGEX.test(ownerPhone)) {
      toast({
        title: "That doesn't look like a valid phone number",
        description: "Enter a 10-digit mobile number starting with 6-9.",
        variant: "destructive",
      });
      return;
    }
    registerVehicle.mutate({ data: { plateNumber, vehicleType, ownerPhone } });
  };

  const canDeleteRow = !canManage || isAdmin;

  return (
    <div>
      <h2 className="text-lg font-serif font-medium mb-4">Vehicle Parking</h2>

      {canManage ? (
        <div>
          <p className="text-sm text-muted-foreground mb-4">Look up which vehicle belongs to which flat.</p>
          {vehicles.isLoading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : vehicles.data && vehicles.data.length > 0 ? (
            <Card>
              <CardContent className="pt-6 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plate Number</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Flat</TableHead>
                      <TableHead>Contact</TableHead>
                      {canDeleteRow && <TableHead className="text-right">Action</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicles.data.map((vehicle) => (
                      <TableRow key={vehicle.id}>
                        <TableCell className="font-medium">{vehicle.plateNumber}</TableCell>
                        <TableCell>{vehicleTypeLabels[vehicle.vehicleType]}</TableCell>
                        <TableCell>{vehicle.ownerName}</TableCell>
                        <TableCell>{vehicle.flatNumber}</TableCell>
                        <TableCell>{vehicle.ownerPhone}</TableCell>
                        {canDeleteRow && (
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              disabled={deleteVehicle.isPending}
                              onClick={() => deleteVehicle.mutate({ params: { id: vehicle.id } })}
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <p className="text-muted-foreground text-sm">No vehicles registered yet.</p>
          )}
        </div>
      ) : myPass.isLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : myPass.data ? (
        <div className="space-y-6">
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <Badge>Active</Badge>
            <p className="text-sm text-muted-foreground">
              Your flat's parking pass was bought by {myPass.data.purchasedByName} for{" "}
              {formatRupees(myPass.data.amountPaidCents)} — it never expires.
            </p>
          </div>

          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Register a vehicle</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="plateNumber">Plate number</Label>
                  <Input
                    id="plateNumber"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(normalizePlateInput(e.target.value))}
                    placeholder={isBharatSeries ? "e.g. 22BH1234AB" : "e.g. MH12AB1234"}
                    maxLength={10}
                    required
                  />
                  <div className="flex items-center gap-3 pt-1">
                    <Switch id="isBharatSeries" checked={isBharatSeries} onCheckedChange={setIsBharatSeries} />
                    <Label htmlFor="isBharatSeries" className="font-normal text-muted-foreground">
                      This is a Bharat (BH) series plate
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicleType">Vehicle type</Label>
                  <Select
                    value={vehicleType}
                    onValueChange={(v) => setVehicleType(v as VehicleInputVehicleType)}
                  >
                    <SelectTrigger id="vehicleType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(vehicleTypeLabels) as VehicleInputVehicleType[]).map((type) => (
                        <SelectItem key={type} value={type}>
                          {vehicleTypeLabels[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownerPhone">Contact number</Label>
                  <Input
                    id="ownerPhone"
                    type="tel"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(normalizePhoneInput(e.target.value))}
                    placeholder="e.g. 9876543210"
                    inputMode="numeric"
                    pattern="[6-9][0-9]{9}"
                    title="10-digit mobile number starting with 6-9"
                    maxLength={10}
                    required
                  />
                </div>

                <Button type="submit" disabled={registerVehicle.isPending} className="w-full">
                  {registerVehicle.isPending ? "Registering…" : "Register vehicle"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div>
            <h3 className="text-base font-medium mb-3">Your vehicles</h3>
            {vehicles.isLoading ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : vehicles.data && vehicles.data.length > 0 ? (
              <Card>
                <CardContent className="pt-6 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Plate Number</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vehicles.data.map((vehicle) => (
                        <TableRow key={vehicle.id}>
                          <TableCell className="font-medium">{vehicle.plateNumber}</TableCell>
                          <TableCell>{vehicleTypeLabels[vehicle.vehicleType]}</TableCell>
                          <TableCell>{vehicle.ownerPhone}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              disabled={deleteVehicle.isPending}
                              onClick={() => deleteVehicle.mutate({ params: { id: vehicle.id } })}
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <p className="text-muted-foreground text-sm">No vehicles registered yet.</p>
            )}
          </div>
        </div>
      ) : (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Buy a parking pass — {formatRupees(500000)}</CardTitle>
            <CardDescription>
              One-time payment for your flat. Once bought, it never expires — register as many vehicles
              as you own, whenever you like.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              disabled={purchasePass.isPending}
              onClick={() => purchasePass.mutate()}
            >
              {purchasePass.isPending ? "Starting checkout…" : `Buy & pay ${formatRupees(500000)}`}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
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
      <div className="relative overflow-hidden bg-primary py-16 border-b">
        <img
          src="https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1600&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
        <div className="relative z-10 container mx-auto px-4 md:px-8">
          <h1 className="text-3xl md:text-4xl font-serif font-medium mb-2 text-primary-foreground">Amenities</h1>
          <p className="text-primary-foreground/80">Book the clubhouse, pool, tennis court, or party hall — or buy a parking pass.</p>
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
                    const past = !taken && isSlotPast(date, s);
                    const disabled = taken || past || availability.isLoading;
                    return (
                      <button
                        key={s}
                        type="button"
                        disabled={disabled}
                        onClick={() => setSlot(s)}
                        className={`rounded-lg border p-3 text-sm text-left transition-colors ${
                          disabled
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
                        {past && <p className="text-xs text-muted-foreground mt-1">Already passed</p>}
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

        <VehicleParkingSection />
      </div>
    </div>
  );
}
