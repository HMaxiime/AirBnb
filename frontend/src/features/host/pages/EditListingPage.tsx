import { useParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { listingSchema, ListingFormData } from "../schemas/listing";
import { ListingFormFields } from "../components/ListingFormFields";
import { useUpdateListing } from "../hooks/useUpdateListing";
import { useListing } from "../../listings/hooks/useListing";
import { Spinner } from "../../../shared/components/Spinner";

export function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const { data: listing, isLoading } = useListing(id);
  const { mutate: update, isPending } = useUpdateListing();

  const form = useForm<ListingFormData>({ resolver: zodResolver(listingSchema) });

  useEffect(() => {
    if (listing) {
      form.reset({
        title:         listing.title,
        description:   listing.description,
        location:      listing.location,
        price:         listing.price,
        guests:        (listing as { guests?: number }).guests ?? 1,
        category:      listing.category,
        available:     listing.available,
        availableFrom: listing.availableFrom ?? "",
        superhost:     listing.superhost,
      });
    }
  }, [listing, form]);

  if (isLoading) return <div className="flex justify-center py-20"><Spinner /></div>;

  const onSubmit = (data: ListingFormData) => {
    if (!id) return;
    update({ id, data });
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f7f7f7] px-4 py-10">
      <div className="max-w-xl mx-auto">
        <Link to="/host" className="text-sm text-gray-500 hover:text-gray-800 mb-6 inline-flex items-center gap-1">← Host dashboard</Link>
        <div className="bg-white border border-[#ebebeb] rounded-2xl p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-6">Edit listing</h1>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ListingFormFields form={form} />
            <button type="submit" disabled={isPending}
              className="w-full py-3 bg-[#ff5a5f] text-white rounded-lg font-semibold hover:bg-[#e0474c] disabled:opacity-60 mt-2">
              {isPending ? "Saving…" : "Save changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
