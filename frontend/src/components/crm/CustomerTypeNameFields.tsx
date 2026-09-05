"use client";

import React from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface CustomerTypeNameFieldsProps {
  customerType: "individual" | "business";
  firstName: string;
  lastName: string;
  onCustomerTypeChange: (type: "individual" | "business") => void;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  typeFieldId?: string;
  firstNameFieldId?: string;
  lastNameFieldId?: string;
  businessNameFieldId?: string;
}

export function CustomerTypeNameFields({
  customerType,
  firstName,
  lastName,
  onCustomerTypeChange,
  onFirstNameChange,
  onLastNameChange,
  typeFieldId = "customerType",
  firstNameFieldId = "firstName",
  lastNameFieldId = "lastName",
  businessNameFieldId = "businessName",
}: CustomerTypeNameFieldsProps) {
  return (
    <>
      <div className="col-span-2">
        <Label htmlFor={typeFieldId}>Customer Type *</Label>
        <Select
          value={customerType}
          onValueChange={(value) =>
            onCustomerTypeChange(value as "individual" | "business")
          }
        >
          <SelectTrigger id={typeFieldId}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="individual">Individual</SelectItem>
            <SelectItem value="business">Business</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {customerType === "individual" ? (
        <>
          <div>
            <Label htmlFor={firstNameFieldId}>First Name *</Label>
            <Input
              id={firstNameFieldId}
              value={firstName}
              onChange={(e) => onFirstNameChange(e.target.value)}
              placeholder="John"
            />
          </div>
          <div>
            <Label htmlFor={lastNameFieldId}>Last Name *</Label>
            <Input
              id={lastNameFieldId}
              value={lastName}
              onChange={(e) => onLastNameChange(e.target.value)}
              placeholder="Doe"
            />
          </div>
        </>
      ) : (
        <div className="col-span-2">
          <Label htmlFor={businessNameFieldId}>Business Name *</Label>
          <Input
            id={businessNameFieldId}
            value={firstName}
            onChange={(e) => onFirstNameChange(e.target.value)}
            placeholder="Acme Corporation"
          />
        </div>
      )}
    </>
  );
}
