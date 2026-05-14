import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { differenceInCalendarDays } from "date-fns";
import numeral from "numeral";
import { useCreateBooking } from "../hooks/useCreateBooking";
import { useAuth } from "../../auth/hooks/useAuth";
import { ExtendedListing } from "../../../lib/api";
import { step1Schema, step2Schema, step3Schema, Step1Data, Step2Data, Step3Data } from "../schemas/booking";

interface Props { listing: ExtendedListing }

const STEPS = ["Dates & Guests", "Your Info", "Payment", "Confirm"];

export function BookingForm({ listing }: Props) {
  const [step, setStep] = useState(0);
  const [s1, setS1] = useState<Step1Data | null>(null);
  const [s2, setS2] = useState<Step2Data | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const { user } = useAuth();
  const { mutate: createBooking, isPending } = useCreateBooking();

  const form1 = useForm<Step1Data>({ resolver: zodResolver(step1Schema), defaultValues: { guests: 1 } });
  const form2 = useForm<Step2Data>({ resolver: zodResolver(step2Schema), defaultValues: { name: user?.name ?? "", email: user?.email ?? "" } });
  const form3 = useForm<Step3Data>({ resolver: zodResolver(step3Schema) });

  const nights = s1 ? Math.max(1, differenceInCalendarDays(new Date(s1.checkOut), new Date(s1.checkIn))) : 1;
  const total = listing.price * nights;

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      form2.setError("name", { message: "Photo must be under 5 MB" });
      return;
    }
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  };

  const onConfirm = () => {
    if (!s1 || !s2 || !user) return;
    createBooking({
      listingId: listing.id,
      listingTitle: listing.title,
      listingImg: listing.img,
      hostId: listing.hostId,
      guestId: user.id,
      guestName: s2.name,
      guestEmail: s2.email,
      guestPhone: s2.phone,
      checkIn: s1.checkIn,
      checkOut: s1.checkOut,
      guests: s1.guests,
      pricePerNight: listing.price,
      totalPrice: total,
      status: "pending",
    });
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Step indicators */}
      <div className="flex gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={i} className="flex-1 text-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-sm font-bold mb-1
              ${i < step ? "bg-green-500 text-white" : i === step ? "bg-[#ff5a5f] text-white" : "bg-gray-200 text-gray-500"}`}>
              {i < step ? "✓" : i + 1}
            </div>
            <p className="text-xs text-gray-500 hidden sm:block">{label}</p>
          </div>
        ))}
      </div>

      {/* Step 1 */}
      {step === 0 && (
        <form onSubmit={form1.handleSubmit((d) => { setS1(d); setStep(1); })} className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Dates & Guests</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Check-in</label>
              <input type="date" {...form1.register("checkIn")} min={new Date().toISOString().split("T")[0]}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#ff5a5f]" />
              {form1.formState.errors.checkIn && <p className="text-red-500 text-xs mt-1">{form1.formState.errors.checkIn.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Check-out</label>
              <input type="date" {...form1.register("checkOut")} min={new Date().toISOString().split("T")[0]}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#ff5a5f]" />
              {form1.formState.errors.checkOut && <p className="text-red-500 text-xs mt-1">{form1.formState.errors.checkOut.message}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Guests</label>
            <input type="number" {...form1.register("guests")} min={1} max={16}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#ff5a5f]" />
            {form1.formState.errors.guests && <p className="text-red-500 text-xs mt-1">{form1.formState.errors.guests.message}</p>}
          </div>
          <button type="submit" className="w-full py-3 bg-[#ff5a5f] text-white rounded-lg font-semibold hover:bg-[#e0474c] transition-colors">
            Continue
          </button>
        </form>
      )}

      {/* Step 2 */}
      {step === 1 && (
        <form onSubmit={form2.handleSubmit((d) => { setS2(d); setStep(2); })} className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Your Information</h2>
          {(["name", "email", "phone"] as const).map((field) => (
            <div key={field}>
              <label className="block text-sm font-semibold text-gray-700 mb-1 capitalize">{field}</label>
              <input type={field === "email" ? "email" : "text"} {...form2.register(field)}
                placeholder={field === "phone" ? "+1 555 000 0000" : ""}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#ff5a5f]" />
              {form2.formState.errors[field] && <p className="text-red-500 text-xs mt-1">{form2.formState.errors[field]?.message}</p>}
            </div>
          ))}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Profile photo (optional, max 5 MB)</label>
            <input type="file" accept="image/*" onChange={handlePhoto}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-semibold file:bg-[#ff5a5f] file:text-white hover:file:bg-[#e0474c]" />
            {photoPreview && <img src={photoPreview} alt="Preview" className="mt-2 w-20 h-20 rounded-full object-cover border-2 border-[#ff5a5f]" />}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(0)} className="flex-1 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50">Back</button>
            <button type="submit" className="flex-1 py-3 bg-[#ff5a5f] text-white rounded-lg font-semibold hover:bg-[#e0474c]">Continue</button>
          </div>
        </form>
      )}

      {/* Step 3 */}
      {step === 2 && (
        <form onSubmit={form3.handleSubmit(() => setStep(3))} className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Payment</h2>
          <p className="text-sm text-gray-500">Mock payment — no real charges</p>
          {([
            { name: "card", label: "Card number (16 digits)", placeholder: "1234567890123456" },
            { name: "expiry", label: "Expiry (MM/YY)", placeholder: "06/27" },
            { name: "cvv", label: "CVV (3 digits)", placeholder: "123" },
          ] as const).map(({ name, label, placeholder }) => (
            <div key={name}>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
              <input type="text" {...form3.register(name)} placeholder={placeholder}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#ff5a5f]" />
              {form3.formState.errors[name] && <p className="text-red-500 text-xs mt-1">{form3.formState.errors[name]?.message}</p>}
            </div>
          ))}
          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50">Back</button>
            <button type="submit" className="flex-1 py-3 bg-[#ff5a5f] text-white rounded-lg font-semibold hover:bg-[#e0474c]">Review booking</button>
          </div>
        </form>
      )}

      {/* Step 4 - Confirmation */}
      {step === 3 && s1 && s2 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Confirm Booking</h2>
          <div className="flex gap-3 p-4 border border-gray-200 rounded-xl">
            <img src={listing.img} alt={listing.title} className="w-20 h-16 rounded-lg object-cover flex-shrink-0" />
            <div>
              <p className="font-semibold text-gray-800 text-sm">{listing.title}</p>
              <p className="text-xs text-gray-500">{listing.location}</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <Row label="Check-in" value={s1.checkIn} />
            <Row label="Check-out" value={s1.checkOut} />
            <Row label="Guests" value={String(s1.guests)} />
            <Row label="Nights" value={String(nights)} />
            <Row label="Guest" value={s2.name} />
            <Row label="Email" value={s2.email} />
            <div className="border-t pt-2 mt-2">
              <Row label="Total" value={numeral(total).format("$0,0")} bold />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50">Back</button>
            <button onClick={onConfirm} disabled={isPending}
              className="flex-1 py-3 bg-[#ff5a5f] text-white rounded-lg font-semibold hover:bg-[#e0474c] disabled:opacity-60">
              {isPending ? "Confirming…" : "Confirm Booking"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={bold ? "font-bold text-gray-900" : "text-gray-800"}>{value}</span>
    </div>
  );
}
