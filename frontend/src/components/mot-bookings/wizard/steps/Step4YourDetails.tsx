"use client";

import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { MOT_TITLE_OPTIONS, type MotWizardCustomer } from "../wizardTypes";

type Step4YourDetailsProps = {
  customer: MotWizardCustomer;
  onChange: (patch: Partial<MotWizardCustomer>) => void;
  onConsentChange: (
    patch: Partial<MotWizardCustomer["contactConsent"]>,
  ) => void;
  onBack: () => void;
  onNext: () => void;
  canNext: boolean;
};

export function Step4YourDetails({
  customer,
  onChange,
  onConsentChange,
  onBack,
  onNext,
  canNext,
}: Step4YourDetailsProps) {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
          Step 04
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight">Your Details</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Fields marked <span className="font-medium">(optional)</span> are not
          required. Fields marked{" "}
          <span className="font-medium">(required)</span> must be completed. By
          submitting this form you agree to our terms and privacy policy.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-sm font-semibold">
            Title{" "}
            <span className="font-normal text-muted-foreground">
              (required)
            </span>
          </Label>
          <Select
            value={customer.title}
            onValueChange={(v) => onChange({ title: v })}
          >
            <SelectTrigger className="h-12 rounded-xl border-2">
              <SelectValue placeholder="Select title" />
            </SelectTrigger>
            <SelectContent>
              {MOT_TITLE_OPTIONS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div />
        <div className="space-y-2">
          <Label className="text-sm font-semibold">
            First Name{" "}
            <span className="font-normal text-muted-foreground">
              (required)
            </span>
          </Label>
          <Input
            value={customer.firstName}
            onChange={(e) => onChange({ firstName: e.target.value })}
            className="h-12 rounded-xl border-2"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-semibold">
            Last Name{" "}
            <span className="font-normal text-muted-foreground">
              (required)
            </span>
          </Label>
          <Input
            value={customer.lastName}
            onChange={(e) => onChange({ lastName: e.target.value })}
            className="h-12 rounded-xl border-2"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-semibold">
            Email{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </Label>
          <Input
            type="email"
            value={customer.email}
            onChange={(e) => onChange({ email: e.target.value })}
            className="h-12 rounded-xl border-2"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-semibold">
            County{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </Label>
          <Input
            value={customer.county}
            onChange={(e) => onChange({ county: e.target.value })}
            className="h-12 rounded-xl border-2"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-semibold">
            Telephone{" "}
            <span className="font-normal text-muted-foreground">
              (required)
            </span>
          </Label>
          <Input
            value={customer.telephone}
            onChange={(e) => onChange({ telephone: e.target.value })}
            className="h-12 rounded-xl border-2"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-semibold">
            House Number{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </Label>
          <Input
            value={customer.houseNumber}
            onChange={(e) => onChange({ houseNumber: e.target.value })}
            className="h-12 rounded-xl border-2"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-semibold">
            Street{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </Label>
          <Input
            value={customer.street}
            onChange={(e) => onChange({ street: e.target.value })}
            className="h-12 rounded-xl border-2"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-semibold">
            Town{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </Label>
          <Input
            value={customer.town}
            onChange={(e) => onChange({ town: e.target.value })}
            className="h-12 rounded-xl border-2"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-semibold">
            Postcode{" "}
            <span className="font-normal text-muted-foreground">
              (required)
            </span>
          </Label>
          <Input
            value={customer.postcode}
            onChange={(e) =>
              onChange({ postcode: e.target.value.toUpperCase() })
            }
            className="h-12 rounded-xl border-2 uppercase"
          />
        </div>
      </div>

      <div className="space-y-4 border-t pt-6">
        <h3 className="text-sm font-bold uppercase tracking-wide">
          Communication Consent
        </h3>
        <p className="text-sm text-muted-foreground">
          Please select the methods you consent to be contacted by
        </p>
        <div className="flex flex-wrap gap-6">
          {(["email", "post", "telephone", "sms"] as const).map((method) => (
            <label
              key={method}
              className="flex cursor-pointer items-center gap-2 capitalize"
            >
              <Checkbox
                checked={customer.contactConsent[method]}
                onCheckedChange={(checked) =>
                  onConsentChange({ [method]: checked === true })
                }
              />
              {method}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">Additional Comments</Label>
        <Textarea
          value={customer.additionalComments}
          onChange={(e) =>
            onChange({ additionalComments: e.target.value.slice(0, 300) })
          }
          placeholder="Additional Comments"
          rows={4}
          className="rounded-xl border-2 resize-none"
        />
        <p className="text-right text-xs text-muted-foreground">
          {customer.additionalComments.length} / 300
        </p>
      </div>

      <div className="space-y-4 border-t pt-6">
        <h3 className="text-sm font-bold uppercase tracking-wide">
          Privacy Policy
        </h3>
        <p className="text-sm text-muted-foreground">
          The information you supply will be used to process your enquiry.
          Please read our full Privacy Policy for details on how your data is
          stored and managed.
        </p>
        <label className="flex cursor-pointer items-start gap-3">
          <Checkbox
            checked={customer.privacyAccepted}
            onCheckedChange={(checked) =>
              onChange({ privacyAccepted: checked === true })
            }
            className="mt-1"
          />
          <span className="text-sm">
            I have read, understood and accept the Privacy Policy — Please read{" "}
            <span className="font-semibold text-primary underline">Here</span>*
          </span>
        </label>
      </div>

      <div className="space-y-4 border-t pt-6">
        <h3 className="text-sm font-bold uppercase tracking-wide">
          Terms and Conditions
        </h3>
        <label className="flex cursor-pointer items-start gap-3">
          <Checkbox
            checked={customer.termsAccepted}
            onCheckedChange={(checked) =>
              onChange({ termsAccepted: checked === true })
            }
            className="mt-1"
          />
          <span className="text-sm">
            I accept the Terms and Conditions — Please read{" "}
            <span className="font-semibold text-primary underline">Here</span>*
          </span>
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          className="h-12 rounded-xl gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!canNext}
          className="h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 text-sm font-bold uppercase tracking-wider hover:from-blue-700 hover:to-purple-700"
        >
          Next Step
        </Button>
      </div>
    </div>
  );
}
