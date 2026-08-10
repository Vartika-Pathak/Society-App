import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListVehicles,
  useRegisterVehicle,
  useDeleteVehicle,
  getListVehiclesQueryKey,
  type VehicleInputVehicleType,
} from "@workspace/api-client-react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";

const vehicleTypeLabels: Record<VehicleInputVehicleType, string> = {
  car: "Car",
  bike: "Bike",
  other: "Other",
};

export default function Vehicles() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [plateNumber, setPlateNumber] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleInputVehicleType>("car");
  const [ownerPhone, setOwnerPhone] = useState("");

  const canManage = user?.role === "guard" || user?.role === "admin";
  const isAdmin = user?.role === "admin";

  const vehicles = useListVehicles({ query: { queryKey: getListVehiclesQueryKey() } });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListVehiclesQueryKey() });

  const registerVehicle = useRegisterVehicle({
    mutation: {
      onSuccess: () => {
        invalidate();
        toast({ title: "Vehicle registered" });
        setPlateNumber("");
        setOwnerPhone("");
      },
      onError: () => {
        toast({ title: "Couldn't register vehicle", description: "Please try again.", variant: "destructive" });
      },
    },
  });

  const deleteVehicle = useDeleteVehicle({
    mutation: {
      onSuccess: () => {
        invalidate();
        toast({ title: "Vehicle removed" });
      },
      onError: () => {
        toast({ title: "Couldn't remove vehicle", description: "Please try again.", variant: "destructive" });
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerVehicle.mutate({ data: { plateNumber, vehicleType, ownerPhone } });
  };

  const canDeleteRow = !canManage || isAdmin;

  return (
    <div className="w-full">
      <div className="relative overflow-hidden bg-primary py-16 border-b">
        <img
          src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1600&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
        <div className="relative z-10 container mx-auto px-4 md:px-8">
          <h1 className="text-3xl md:text-4xl font-serif font-medium mb-2 text-primary-foreground">
            Vehicle Parking
          </h1>
          <p className="text-primary-foreground/80">
            {canManage
              ? "Look up which vehicle belongs to which flat."
              : "Register your vehicle so the gate can identify it."}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-16 space-y-10">
        {!canManage && (
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Register a vehicle</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="plateNumber">Plate number</Label>
                  <Input
                    id="plateNumber"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    placeholder="e.g. MH12AB1234"
                    required
                  />
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
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    required
                  />
                </div>

                <Button type="submit" disabled={registerVehicle.isPending} className="w-full">
                  {registerVehicle.isPending ? "Registering…" : "Register vehicle"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div>
          <h2 className="text-lg font-serif font-medium mb-4">
            {canManage ? "All registered vehicles" : "Your vehicles"}
          </h2>
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
      </div>
    </div>
  );
}
