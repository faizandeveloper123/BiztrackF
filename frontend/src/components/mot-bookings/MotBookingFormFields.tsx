"use client";

import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  MOT_BOOKING_STATUSES,
  MOT_TEST_TYPES,
  MOT_TIME_SLOTS,
} from "@/src/models/mot/MotBooking";
import type { MotBookingFormData } from "./types";
import { timeSlotKey } from "./motBookingUtils";

type MotBookingFormFieldsProps = {
  formData: MotBookingFormData;
  onChange: (patch: Partial<MotBookingFormData>) => void;
  onTimeSlotChange: (slotKey: string) => void;
};

export function MotBookingFormFields({
  formData,
  onChange,
  onTimeSlotChange,
}: MotBookingFormFieldsProps) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="customerName">Customer name</Label>
          <Input
            id="customerName"
            value={formData.customerName}
            onChange={(e) => onChange({ customerName: e.target.value })}
            placeholder="Full name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customerPhone">Phone</Label>
          <Input
            id="customerPhone"
            value={formData.customerPhone}
            onChange={(e) => onChange({ customerPhone: e.target.value })}
            placeholder="Phone number"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="customerEmail">Email</Label>
          <Input
            id="customerEmail"
            type="email"
            value={formData.customerEmail}
            onChange={(e) => onChange({ customerEmail: e.target.value })}
            placeholder="Email address"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="vehicleRegistration">Registration</Label>
          <Input
            id="vehicleRegistration"
            value={formData.vehicleRegistration}
            onChange={(e) =>
              onChange({ vehicleRegistration: e.target.value.toUpperCase() })
            }
            placeholder="AB12 CDE"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vehicleMake">Make</Label>
          <Input
            id="vehicleMake"
            value={formData.vehicleMake}
            onChange={(e) => onChange({ vehicleMake: e.target.value })}
            placeholder="Make"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vehicleModel">Model</Label>
          <Input
            id="vehicleModel"
            value={formData.vehicleModel}
            onChange={(e) => onChange({ vehicleModel: e.target.value })}
            placeholder="Model"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mileage">Mileage</Label>
          <Input
            id="mileage"
            value={formData.mileage}
            onChange={(e) => onChange({ mileage: e.target.value })}
            placeholder="Mileage"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="bookingDate">Booking date</Label>
          <Input
            id="bookingDate"
            type="date"
            value={formData.bookingDate}
            onChange={(e) => onChange({ bookingDate: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Time slot</Label>
          <Select
            value={timeSlotKey(formData)}
            onValueChange={onTimeSlotChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select time slot" />
            </SelectTrigger>
            <SelectContent>
              {MOT_TIME_SLOTS.map((slot) => (
                <SelectItem
                  key={`${slot.start}-${slot.end}`}
                  value={`${slot.start}-${slot.end}`}
                >
                  {slot.start} – {slot.end}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Test type</Label>
          <Select
            value={formData.testType}
            onValueChange={(value) =>
              onChange({ testType: value as MotBookingFormData["testType"] })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MOT_TEST_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) =>
              onChange({ status: value as MotBookingFormData["status"] })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MOT_BOOKING_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">Price</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => onChange({ price: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="motExpiryDate">Next MOT due</Label>
          <Input
            id="motExpiryDate"
            type="date"
            value={formData.motExpiryDate}
            onChange={(e) => onChange({ motExpiryDate: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="resultNotes">Result notes</Label>
        <Textarea
          id="resultNotes"
          value={formData.resultNotes}
          onChange={(e) => onChange({ resultNotes: e.target.value })}
          rows={3}
        />
      </div>
    </div>
  );
}
