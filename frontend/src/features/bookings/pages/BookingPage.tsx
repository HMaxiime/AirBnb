import { useParams, Link } from "react-router-dom";
import { useListing } from "../../listings/hooks/useListing";
import { BookingForm } from "../components/BookingForm";
import { Spinner } from "../../../shared/components/Spinner";
import numeral from "numeral";

export function BookingPage() {
  const { id } = useParams<{ id: string }>();
  const { data: listing, isLoading, isError } = useListing(id);

  if (isLoading) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (isError || !listing) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Listing not found.</p>
      <Link to="/" className="text-[#ff5a5f] font-semibold mt-2 inline-block">Back to listings</Link>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f7f7f7] px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <Link to={`/listings/${listing.id}`} className="text-sm text-gray-500 hover:text-gray-800 mb-6 inline-flex items-center gap-1">
          ← Back to listing
        </Link>

        <div className="bg-white border border-[#ebebeb] rounded-2xl p-6 mb-6 flex gap-4">
          <img src={listing.img} alt={listing.title} className="w-24 h-20 rounded-xl object-cover flex-shrink-0" />
          <div>
            <h1 className="font-semibold text-gray-900">{listing.title}</h1>
            <p className="text-sm text-gray-500">{listing.location}</p>
            <p className="text-sm font-bold text-gray-900 mt-1">{numeral(listing.price).format("$0")}<span className="font-normal text-gray-500"> / night</span></p>
          </div>
        </div>

        <div className="bg-white border border-[#ebebeb] rounded-2xl p-6">
          <BookingForm listing={listing} />
        </div>
      </div>
    </div>
  );
}
