"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ModuleGuard } from "../../../components/guards/PermissionGuard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Plus, Edit, Trash2, Car } from "lucide-react";
import { apiService } from "../../../services/ApiService";
import { DashboardLayout } from "../../../components/layout";
import { useCrudPermissions } from "../../../hooks/usePermissions";
import { Vehicle } from "../../../models/workshop";
import VehicleDialog from "../../../components/workshop/VehicleDialog";

function VehiclesContent() {
  const { canCreate, canUpdate, canDelete } = useCrudPermissions(
    "production:vehicles",
  );
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);

  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiService.get("/vehicles?limit=500");
      setVehicles(Array.isArray(data) ? data : []);
    } catch {
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const filtered = vehicles.filter((v) => {
    const q = searchTerm.toLowerCase();
    return (
      !searchTerm ||
      (v.registration_number || "").toLowerCase().includes(q) ||
      (v.vin || "").toLowerCase().includes(q) ||
      (v.make || "").toLowerCase().includes(q) ||
      (v.model || "").toLowerCase().includes(q) ||
      (v.year || "").toLowerCase().includes(q) ||
      (v.color || "").toLowerCase().includes(q)
    );
  });

  const openCreate = () => {
    setSelectedVehicle(null);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const openEdit = (v: Vehicle) => {
    setSelectedVehicle(v);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handleDeleteVehicle = (v: Vehicle) => {
    setVehicleToDelete(v);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteVehicle = async () => {
    if (!vehicleToDelete) return;
    try {
      await apiService.delete(`/vehicles/${vehicleToDelete.id}`);
      setVehicles(vehicles.filter((v) => v.id !== vehicleToDelete.id));
      setDeleteDialogOpen(false);
      setVehicleToDelete(null);
    } catch {
      setDeleteDialogOpen(false);
      setVehicleToDelete(null);
    }
  };

  const displayLine = (v: Vehicle) => {
    const parts = [v.registration_number, v.make, v.model, v.year].filter(
      Boolean,
    );
    return parts.length ? parts.join(" · ") : v.vin || "–";
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Car className="h-8 w-8" />
              Vehicles
            </h1>
            <p className="text-gray-600">
              Manage workshop vehicles. Use them in job cards and invoices.
            </p>
          </div>
          {canCreate() && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              New Vehicle
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Vehicles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Search by reg, VIN, make, model..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            {loading ? (
              <div className="py-8 text-center text-gray-500">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                No vehicles found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Registration</th>
                      <th className="text-left py-2">Make / Model</th>
                      <th className="text-left py-2">Year</th>
                      <th className="text-left py-2">Color</th>
                      <th className="text-left py-2">VIN</th>
                      <th className="text-left py-2">Mileage</th>
                      <th className="text-right py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((v) => (
                      <tr key={v.id} className="border-b hover:bg-gray-50">
                        <td className="py-2">{v.registration_number || "–"}</td>
                        <td className="py-2">
                          {v.make || v.model
                            ? [v.make, v.model].filter(Boolean).join(" ")
                            : "–"}
                        </td>
                        <td className="py-2">{v.year || "–"}</td>
                        <td className="py-2">{v.color || "–"}</td>
                        <td className="py-2 font-mono text-sm">
                          {v.vin || "–"}
                        </td>
                        <td className="py-2">{v.mileage || "–"}</td>
                        <td className="py-2 text-right">
                          {canUpdate() && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(v)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          )}
                          {canDelete() && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteVehicle(v)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <VehicleDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          mode={dialogMode}
          vehicle={selectedVehicle}
          onSuccess={fetchVehicles}
        />
        {deleteDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Delete Vehicle</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete &quot;
                {vehicleToDelete && displayLine(vehicleToDelete)}&quot;? This
                action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleteDialogOpen(false);
                    setVehicleToDelete(null);
                  }}
                >
                  Cancel
                </Button>
                <Button variant="destructive" onClick={confirmDeleteVehicle}>
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function VehiclesPage() {
  return (
    <ModuleGuard
      module="production"
      fallback={<div>You don&apos;t have access to this module</div>}
    >
      <VehiclesContent />
    </ModuleGuard>
  );
}
