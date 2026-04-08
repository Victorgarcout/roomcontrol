"use client";

import { useRouter } from "next/navigation";
import { AdvancedBookingForm } from "@/components/bookings/advanced-booking-form";

export default function NewBookingPage() {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto p-6">
      <AdvancedBookingForm
        onSuccess={() => router.push("/bookings")}
        onCancel={() => router.back()}
      />
    </div>
  );
}
