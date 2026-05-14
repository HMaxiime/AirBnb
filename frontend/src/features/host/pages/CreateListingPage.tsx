import { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { listingSchema, ListingFormData } from "../schemas/listing";
import { ListingFormFields } from "../components/ListingFormFields";
import { useCreateListing } from "../hooks/useCreateListing";

// ── Single photo slot ──────────────────────────────────────────────────────────

interface SlotProps {
  label: string;
  required?: boolean;
  file: File | null;
  onChange: (f: File | null) => void;
}

function PhotoSlot({ label, required, file, onChange }: SlotProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview,    setPreview]    = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = (f: File) => {
    if (!f.type.startsWith("image/")) return;
    setPreview(URL.createObjectURL(f));
    onChange(f);
  };

  const clear = () => {
    setPreview(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) accept(f);
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) accept(f);
    e.target.value = "";
  };

  return (
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-gray-600 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </p>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`relative border-2 border-dashed rounded-xl cursor-pointer transition-colors overflow-hidden
          ${isDragging ? "border-[#ff5a5f] bg-red-50" : "border-gray-300 hover:border-[#ff5a5f] bg-gray-50"}`}
        style={{ height: 130 }}
      >
        {preview || (file && preview !== null) ? (
          <>
            <img src={preview!} alt={label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center group">
              <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-semibold bg-black/50 px-2 py-1 rounded-lg transition-opacity">
                Change
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); clear(); }}
              className="absolute top-1.5 right-1.5 bg-white rounded-full w-6 h-6 flex items-center justify-center shadow text-gray-500 hover:text-red-500 text-xs font-bold z-10"
            >
              ✕
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-1.5 text-gray-400 select-none px-2">
            <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 16.5V9.75m0 0-3 3m3-3 3 3M6.75 19.5a4.5 4.5 0 0 1-1.632-8.683 3 3 0 0 1 5.565-1.31 5.25 5.25 0 0 1 9.56 2.516A4.5 4.5 0 0 1 17.25 19.5H6.75Z" />
            </svg>
            <p className="text-xs font-medium text-gray-500 text-center leading-tight">
              {required ? "Required" : "Optional"}
            </p>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={onFileChange} />
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

const CATEGORY_TO_TYPE: Record<string, "APARTMENT" | "HOUSE" | "ROOM" | "OTHER"> = {
  house:     "HOUSE",
  apartment: "APARTMENT",
  villa:     "OTHER",
};

export function CreateListingPage(): React.JSX.Element {
  const { mutate: create, isPending } = useCreateListing();

  const form = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: { available: true, superhost: false, category: "house", guests: 1 },
  });

  const [photo1, setPhoto1] = useState<File | null>(null);
  const [photo2, setPhoto2] = useState<File | null>(null);
  const [photo3, setPhoto3] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState("");

  const onSubmit = (data: ListingFormData): void => {
    if (!photo1) {
      setPhotoError("Please upload at least one photo.");
      return;
    }
    setPhotoError("");

    const photos = [photo1, photo2, photo3].filter((f): f is File => f !== null);

    create({
      fields: {
        title:       data.title,
        description: data.description,
        location:    data.location,
        price:       data.price,
        guests:      data.guests,
        category:    data.category,
        type:        CATEGORY_TO_TYPE[data.category] ?? "OTHER",
        amenities:   [],
      },
      photos,
    });
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f7f7f7] px-4 py-10">
      <div className="max-w-xl mx-auto">
        <Link to="/host" className="text-sm text-gray-500 hover:text-gray-800 mb-6 inline-flex items-center gap-1">
          ← Host dashboard
        </Link>

        <div className="bg-white border border-[#ebebeb] rounded-2xl p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-6">Create a new listing</h1>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <ListingFormFields form={form} />

            {/* ── Photos ── */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Listing photos
              </label>
              <p className="text-xs text-gray-400 mb-3">
                The first photo will be the cover image. JPEG, PNG, WEBP or GIF · max 5 MB each.
              </p>
              <div className="flex gap-3">
                <PhotoSlot label="Photo 1" required file={photo1} onChange={setPhoto1} />
                <PhotoSlot label="Photo 2"        file={photo2} onChange={setPhoto2} />
                <PhotoSlot label="Photo 3"        file={photo3} onChange={setPhoto3} />
              </div>
              {photoError && <p className="text-red-500 text-xs mt-2">{photoError}</p>}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 bg-[#ff5a5f] text-white rounded-lg font-semibold hover:bg-[#e0474c] disabled:opacity-60 mt-2"
            >
              {isPending ? "Creating…" : "Create listing"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
