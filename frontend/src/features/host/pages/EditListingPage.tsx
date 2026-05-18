import { useParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { listingSchema, ListingFormData } from "../schemas/listing";
import { ListingFormFields } from "../components/ListingFormFields";
import { useUpdateListing } from "../hooks/useUpdateListing";
import { useListing } from "../../listings/hooks/useListing";
import { Spinner } from "../../../shared/components/Spinner";

const CATEGORY_TO_TYPE: Record<string, "APARTMENT" | "HOUSE" | "VILLA" | "OTHER"> = {
  house:     "HOUSE",
  apartment: "APARTMENT",
  villa:     "VILLA",
};

function PhotoSlot({
  existing,
  file,
  onChange,
  label,
}: {
  existing?: string;
  file: File | null;
  onChange: (f: File | null) => void;
  label: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = file ? URL.createObjectURL(file) : existing ?? null;

  return (
    <div className="flex flex-col items-center gap-1.5 flex-1">
      <div
        onClick={() => inputRef.current?.click()}
        className="w-full aspect-square rounded-xl border-2 border-dashed border-gray-200 overflow-hidden cursor-pointer hover:border-[#ff5a5f] transition-colors relative bg-gray-50 flex items-center justify-center"
      >
        {preview ? (
          <>
            <img src={preview} alt={label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-xs font-semibold">Replace</span>
            </div>
          </>
        ) : (
          <span className="text-2xl text-gray-300">+</span>
        )}
      </div>
      <span className="text-[11px] text-gray-400">{label}</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          if (f.size > 5 * 1024 * 1024) return;
          onChange(f);
        }}
      />
    </div>
  );
}

export function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const { data: listing, isLoading } = useListing(id);
  const { mutate: update, isPending } = useUpdateListing();

  const [photo1, setPhoto1] = useState<File | null>(null);
  const [photo2, setPhoto2] = useState<File | null>(null);
  const [photo3, setPhoto3] = useState<File | null>(null);

  const form = useForm<ListingFormData>({ resolver: zodResolver(listingSchema) });

  useEffect(() => {
    if (listing) {
      form.reset({
        title:         listing.title,
        description:   (listing as any).description ?? "",
        location:      listing.location,
        price:         listing.price,
        guests:        (listing as any).guests ?? 1,
        category:      listing.category,
        available:     listing.available,
        availableFrom: listing.availableFrom ?? "",
        superhost:     listing.superhost,
      });
    }
  }, [listing, form]);

  if (isLoading) return <div className="flex justify-center py-20"><Spinner /></div>;

  const existingPhotos: string[] = Array.isArray((listing as any)?.photos)
    ? (listing as any).photos
    : listing?.img ? [listing.img] : [];

  const onSubmit = (data: ListingFormData) => {
    if (!id) return;
    const newPhotos = [photo1, photo2, photo3].filter((f): f is File => f !== null);
    update({
      id,
      fields: {
        title:       data.title,
        description: data.description,
        location:    data.location,
        price:       data.price,
        guests:      data.guests,
        type:        CATEGORY_TO_TYPE[data.category] ?? "OTHER",
        amenities:   (listing as any)?.amenities ?? [],
      },
      photos:        newPhotos.length > 0 ? newPhotos : undefined,
      replacePhotos: newPhotos.length > 0,
    });
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f7f7f7] px-4 py-10">
      <div className="max-w-xl mx-auto">
        <Link to="/host/listings" className="text-sm text-gray-500 hover:text-gray-800 mb-6 inline-flex items-center gap-1">
          ← My listings
        </Link>

        <div className="bg-white border border-[#ebebeb] rounded-2xl p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-6">Edit listing</h1>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <ListingFormFields form={form} />

            {/* Photos */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Photos</label>
              <p className="text-xs text-gray-400 mb-3">
                Click a photo to replace it. Leave slots empty to keep existing photos. JPEG, PNG, WEBP · max 5 MB each.
              </p>
              <div className="flex gap-3">
                <PhotoSlot label="Photo 1" existing={existingPhotos[0]} file={photo1} onChange={setPhoto1} />
                <PhotoSlot label="Photo 2" existing={existingPhotos[1]} file={photo2} onChange={setPhoto2} />
                <PhotoSlot label="Photo 3" existing={existingPhotos[2]} file={photo3} onChange={setPhoto3} />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 bg-[#ff5a5f] text-white rounded-lg font-semibold hover:bg-[#e0474c] disabled:opacity-60 mt-2"
            >
              {isPending ? "Saving…" : "Save changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
