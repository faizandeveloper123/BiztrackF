"use client";

import type { MotBooking } from "@/src/models/mot/MotBooking";
import {
  formatBookingDateTime,
  getDeliveryOptionLabel,
  getMotServiceById,
} from "./wizardUtils";
import { MOT_INSPECTION_PRICE } from "./wizardTypes";

const MOT_LOGO_SRC = "/mot/saks-auto-world-logo.jpeg";

type MotBookingPrintSheetProps = {
  booking: MotBooking;
};

export function MotBookingPrintSheet({ booking }: MotBookingPrintSheetProps) {
  const meta = (booking.booking_meta || {}) as Record<string, unknown>;
  const customer = (meta.customer || {}) as Record<string, string>;
  const servicesMeta = (meta.services || {}) as Record<string, unknown>;
  const bookingRef = booking.id.slice(0, 8).toUpperCase();
  const storedMotPrice = Number(servicesMeta.motPrice);
  const motPrice =
    Number.isFinite(storedMotPrice) && storedMotPrice >= 0
      ? storedMotPrice
      : MOT_INSPECTION_PRICE;
  const selectedServices = (() => {
    const fromIds = Array.isArray(servicesMeta.selectedServiceIds)
      ? servicesMeta.selectedServiceIds
          .map((id) =>
            typeof id === "string"
              ? getMotServiceById(id, motPrice)
              : undefined,
          )
          .filter((service): service is NonNullable<typeof service> =>
            Boolean(service),
          )
      : [];
    const hasMot =
      servicesMeta.motInspection === true ||
      (servicesMeta.motInspection !== false &&
        Array.isArray(servicesMeta.selectedServiceIds) &&
        servicesMeta.selectedServiceIds.includes("mot-inspection")) ||
      (servicesMeta.motInspection !== false &&
        !Array.isArray(servicesMeta.selectedServiceIds));
    const motService = hasMot
      ? getMotServiceById("mot-inspection", motPrice)
      : undefined;
    if (motService && !fromIds.some((s) => s.id === "mot-inspection")) {
      return [motService, ...fromIds.filter((s) => s.id !== "mot-inspection")];
    }
    return fromIds.filter((s) => s.id !== "mot-inspection");
  })();
  const bookingTotal =
    Number(booking.price) ||
    selectedServices.reduce((sum, s) => sum + s.price, 0) ||
    MOT_INSPECTION_PRICE;

  return (
    <div
      id="mot-print-sheet"
      className="hidden print:fixed print:inset-0 print:z-[9999] print:block print:bg-white print:p-8"
    >
      <div className="mx-auto max-w-[800px] border-2 border-slate-200 bg-white p-8 font-sans text-slate-900">
        <div className="flex items-start gap-6">
          <img
            src={MOT_LOGO_SRC}
            alt="Saks Auto World"
            className="h-24 w-auto shrink-0 object-contain"
          />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">
              MOT Test Booking
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">
              Booking Confirmation
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Reference: MOT-{bookingRef}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6">
          <section>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">
              Vehicle
            </h2>
            <p className="text-lg font-bold uppercase">
              {[
                booking.vehicle_make,
                booking.vehicle_model,
                booking.vehicle_year,
              ]
                .filter(Boolean)
                .join(" ")}
            </p>
            <p className="font-mono text-sm">{booking.vehicle_registration}</p>
            <p className="text-sm text-slate-600">
              Mileage: {booking.mileage || "—"}
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">
              Appointment
            </h2>
            <p className="font-semibold">
              {formatBookingDateTime(
                booking.booking_date?.slice(0, 10) || "",
                booking.start_time,
              )}
            </p>
            <p className="text-sm text-slate-600">
              {getDeliveryOptionLabel(
                (booking.delivery_option as
                  | "drop_off"
                  | "wait_security"
                  | "wait_on_site") || "",
              )}
            </p>
            {booking.mot_expiry_date && (
              <p className="text-sm font-semibold text-slate-700">
                Next MOT due: {booking.mot_expiry_date.slice(0, 10)}
              </p>
            )}
          </section>

          <section>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">
              Customer
            </h2>
            <p className="font-semibold">{booking.customer_name}</p>
            <p className="text-sm">{booking.customer_email}</p>
            <p className="text-sm">{booking.customer_phone}</p>
            {(customer.street || customer.town) && (
              <p className="text-sm text-slate-600">
                {[
                  customer.houseNumber,
                  customer.street,
                  customer.town,
                  customer.postcode,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
          </section>
        </div>

        <div className="mt-8 rounded-xl bg-slate-50 p-5">
          {selectedServices.map((service, index) => (
            <div
              key={service.id}
              className={`flex items-center justify-between py-2 ${
                index < selectedServices.length - 1
                  ? "border-b border-slate-200"
                  : ""
              }`}
            >
              <span className="font-medium">{service.label}</span>
              <span className="font-bold">£{service.price.toFixed(2)}</span>
            </div>
          ))}
          <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 text-lg font-black">
            <span>TOTAL</span>
            <span>£{bookingTotal.toFixed(2)}</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            *Payable on day of appointment
          </p>
        </div>

        <div className="mt-8 flex items-end justify-between border-t border-slate-200 pt-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500">
              Status
            </p>
            <p className="font-bold uppercase">{booking.status}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">
              Powered by BizTrack Workshop
            </p>
            <p className="text-xs text-slate-400">
              Printed {new Date().toLocaleString("en-GB")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function printMotBooking() {
  window.print();
}

export async function exportMotBookingPdf(bookingRef: string): Promise<void> {
  const element = document.getElementById("mot-print-sheet");
  if (!element) {
    throw new Error("Print sheet not found");
  }

  const previousClassName = element.className;
  const previousStyle = element.getAttribute("style") || "";

  element.className = previousClassName.replace(/\bhidden\b/g, "").trim();
  element.setAttribute(
    "style",
    `${previousStyle};position:fixed;left:0;top:0;width:800px;background:#fff;z-index:-9999;`,
  );

  try {
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");

    const images = element.querySelectorAll("img");
    await Promise.all(
      Array.from(images).map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) {
              resolve();
              return;
            }
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }),
      ),
    );

    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: "#ffffff",
      logging: false,
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = (canvas.height * pageWidth) / canvas.width;
    pdf.addImage(imgData, "JPEG", 0, 0, pageWidth, imgHeight);
    pdf.save(`mot-booking-${bookingRef}.pdf`);
  } finally {
    element.className = previousClassName;
    if (previousStyle) {
      element.setAttribute("style", previousStyle);
    } else {
      element.removeAttribute("style");
    }
  }
}
