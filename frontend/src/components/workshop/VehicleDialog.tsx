"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Alert, AlertDescription } from "../ui/alert";
import { Vehicle, VehicleCreate, VehicleUpdate } from "../../models/workshop";
import { apiService } from "../../services/ApiService";
import axios from "axios";

interface VehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  vehicle?: Vehicle | null;
  onSuccess: () => void;
  onCreated?: (vehicle: Vehicle) => void;
}

export default function VehicleDialog({
  open,
  onOpenChange,
  mode,
  vehicle,
  onSuccess,
  onCreated,
}: VehicleDialogProps) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    make: "",
    model: "",
    year: "",
    color: "",
    vin: "",
    registration_number: "",
    mileage: "",
    engine_number: "",
    notes: "",
  });

  useEffect(() => {
    if (vehicle && mode === "edit") {
      setFormData({
        make: vehicle.make ?? "",
        model: vehicle.model ?? "",
        year: vehicle.year ?? "",
        color: vehicle.color ?? "",
        vin: vehicle.vin ?? "",
        registration_number: vehicle.registration_number ?? "",
        mileage: vehicle.mileage ?? "",
        engine_number: vehicle.engine_number ?? "",
        notes: vehicle.notes ?? "",
      });
    } else if (mode === "create") {
      setFormData({
        make: "",
        model: "",
        year: "",
        color: "",
        vin: "",
        registration_number: "",
        mileage: "",
        engine_number: "",
        notes: "",
      });
    }
    setErrorMessage("");
  }, [vehicle, mode, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const registrationNumber = formData.registration_number.trim();
    const make = formData.make.trim();
    const model = formData.model.trim();
    if (!registrationNumber || !make || !model) {
      setErrorMessage("Registration number, make, and model are required.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "create") {
        const payload: VehicleCreate = {
          make,
          model,
          year: formData.year.trim() || undefined,
          color: formData.color.trim() || undefined,
          vin: formData.vin.trim() || undefined,
          registration_number: registrationNumber,
          mileage: formData.mileage.trim() || undefined,
          engine_number: formData.engine_number.trim() || undefined,
          notes: formData.notes.trim() || undefined,
        };
        const created = (await apiService.post(
          "/vehicles",
          payload,
        )) as Vehicle;
        onCreated?.(created);
      } else if (vehicle) {
        const payload: VehicleUpdate = {
          make,
          model,
          year: formData.year.trim() || undefined,
          color: formData.color.trim() || undefined,
          vin: formData.vin.trim() || undefined,
          registration_number: registrationNumber,
          mileage: formData.mileage.trim() || undefined,
          engine_number: formData.engine_number.trim() || undefined,
          notes: formData.notes.trim() || undefined,
        };
        await apiService.put(`/vehicles/${vehicle.id}`, payload);
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const detail = error.response?.data?.detail;
        if (typeof detail === "string" && detail.trim()) {
          setErrorMessage(detail);
        } else {
          setErrorMessage("Failed to save vehicle.");
        }
      } else {
        setErrorMessage("Failed to save vehicle.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "New Vehicle" : "Edit Vehicle"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Registration number</Label>
              <Input
                required
                value={formData.registration_number}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    registration_number: e.target.value,
                  })
                }
                placeholder="e.g. ABC 1234"
              />
            </div>
            <div>
              <Label>VIN</Label>
              <Input
                value={formData.vin}
                onChange={(e) =>
                  setFormData({ ...formData, vin: e.target.value })
                }
                placeholder="Vehicle Identification Number"
              />
            </div>
            <div>
              <Label>Make</Label>
              <Input
                required
                value={formData.make}
                onChange={(e) =>
                  setFormData({ ...formData, make: e.target.value })
                }
                placeholder="e.g. Toyota"
              />
            </div>
            <div>
              <Label>Model</Label>
              <Input
                required
                value={formData.model}
                onChange={(e) =>
                  setFormData({ ...formData, model: e.target.value })
                }
                placeholder="e.g. Corolla"
              />
            </div>
            <div>
              <Label>Year</Label>
              <Input
                value={formData.year}
                onChange={(e) =>
                  setFormData({ ...formData, year: e.target.value })
                }
                placeholder="e.g. 2020"
              />
            </div>
            <div>
              <Label>Color</Label>
              <Input
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                placeholder="e.g. Silver"
              />
            </div>
            <div>
              <Label>Mileage</Label>
              <Input
                value={formData.mileage}
                onChange={(e) =>
                  setFormData({ ...formData, mileage: e.target.value })
                }
                placeholder="e.g. 50000 km"
              />
            </div>
            <div>
              <Label>Engine Number</Label>
              <Input
                value={formData.engine_number}
                onChange={(e) =>
                  setFormData({ ...formData, engine_number: e.target.value })
                }
                placeholder="Engine no."
              />
            </div>
            <div className="md:col-span-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={2}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
