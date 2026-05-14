import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import numeral from "numeral";
import { IoArrowBack, IoStar, IoLocationSharp, IoHeart, IoHeartOutline, IoClose, IoChevronBack, IoChevronForward } from "react-icons/io5";
import { useListing } from "../hooks/useListing";
import { useFavorites } from "../hooks/useFavorites";
import { useAuth } from "../../auth/hooks/useAuth";
import { reviewsApi, Review } from "../../../lib/api";
import { Spinner } from "../../../shared/components/Spinner";
import "./ListingDetail.css";

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="star-picker">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button"
          className={`star-pick-btn${(hover || value) >= s ? " lit" : ""}`}
          onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}>
          ★
        </button>
      ))}
    </div>
  );
}

function ReviewsSection({ listingId }: { listingId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  const { data: reviews = [], isLoading } = useQuery<Review[]>({
    queryKey: ["reviews", listingId],
    queryFn: () => reviewsApi.getByListing(listingId),
  });

  const { mutate: submit, isPending } = useMutation({
    mutationFn: (data: Omit<Review, "id" | "createdAt">) => reviewsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews", listingId] });
      setRating(0);
      setComment("");
      setError("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) { setError("Please select a rating."); return; }
    if (comment.trim().length < 10) { setError("Comment must be at least 10 characters."); return; }
    submit({ listingId, guestName: user?.name ?? "Anonymous", rating, comment: comment.trim() });
  };

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="reviews-section">
      <div className="reviews-header">
        <h2 className="reviews-title">
          <IoStar className="reviews-star" />
          {avgRating ? `${avgRating} · ${reviews.length} review${reviews.length !== 1 ? "s" : ""}` : "No reviews yet"}
        </h2>
      </div>

      {isLoading ? <Spinner /> : (
        <div className="reviews-list">
          {reviews.map((r) => (
            <div key={r.id} className="review-card">
              <div className="review-top">
                <div className="review-avatar">{r.guestName.charAt(0).toUpperCase()}</div>
                <div>
                  <p className="review-name">{r.guestName}</p>
                  <p className="review-date">{format(new Date(r.createdAt), "MMMM yyyy")}</p>
                </div>
                <div className="review-stars">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
              </div>
              <p className="review-comment">{r.comment}</p>
            </div>
          ))}
        </div>
      )}

      <div className="review-form-wrap">
        <h3 className="review-form-title">Leave a review</h3>
        <form onSubmit={handleSubmit} className="review-form">
          <StarPicker value={rating} onChange={setRating} />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this property…"
            rows={4}
            className="review-textarea"
          />
          {error && <p className="review-error">{error}</p>}
          <button type="submit" disabled={isPending} className="review-submit">
            {isPending ? "Submitting…" : "Submit review"}
          </button>
        </form>
      </div>
    </div>
  );
}

export function ListingDetail(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: listing, isLoading, isError } = useListing(id);
  const { toggle, isSaved } = useFavorites();
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (isLoading) return <div className="listing-detail-page"><div className="detail-loading"><Spinner /></div></div>;

  if (isError || !listing) {
    return (
      <div className="listing-detail-page">
        <div className="detail-not-found">
          <h1>Listing Not Found</h1>
          <p>Sorry, we couldn't find this listing.</p>
          <button onClick={() => navigate("/")} className="back-to-home">Back to Listings</button>
        </div>
      </div>
    );
  }

  // Backend returns photos as {id, url, publicId}[]; mock returns string[].
  const photos: string[] = (() => {
    const raw = (listing as any).photos as unknown;
    if (Array.isArray(raw) && raw.length > 0) {
      return (raw as Array<string | { url: string }>).map((p) =>
        typeof p === "string" ? p : p.url,
      );
    }
    const img = (listing as any).img as string | undefined;
    return img ? [img] : [];
  })();
  const saved = isSaved(listing.id);

  const prevPhoto = (): void => setLightbox((i) => Math.max(0, i! - 1));
  const nextPhoto = (): void => setLightbox((i) => Math.min(photos.length - 1, i! + 1));

  return (
    <div className="listing-detail-page">
      <div className="detail-container">

        <button onClick={() => navigate(-1)} className="detail-back-button">
          <IoArrowBack /> Back
        </button>

        {/* ── Photo gallery ── */}
        <div className={`photo-gallery pg-${Math.min(photos.length, 5)}`}>
          {photos.slice(0, 5).map((src, i) => (
            <div key={i} className={`photo-slot slot-${i}`} onClick={() => setLightbox(i)}>
              <img src={src} alt={`${listing.title} ${i + 1}`} />
              {i === 4 && photos.length > 5 && (
                <div className="photo-more-overlay">+{photos.length - 5} photos</div>
              )}
            </div>
          ))}
          {/* Save button overlaid on main photo */}
          <button
            className={`gallery-save-btn${saved ? " saved" : ""}`}
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); toggle(listing.id, listing.title); }}
            aria-label={saved ? "Remove from saved" : "Save"}
          >
            {saved ? <IoHeart /> : <IoHeartOutline />}
          </button>
        </div>

        {/* ── Content ── */}
        <div className="detail-content">
          <div className="detail-header">
            <div>
              <h1 className="detail-title">{listing.title}</h1>
              {listing.rating != null && (
                <div className="detail-rating">
                  <IoStar className="star-icon" />
                  <span>{numeral(listing.rating).format("0.00")}</span>
                </div>
              )}
            </div>
          </div>

          <div className="detail-location">
            <IoLocationSharp className="location-icon" />
            <span>{listing.location}</span>
          </div>

          {"description" in listing && listing.description && (
            <p className="detail-description">{listing.description as string}</p>
          )}

          <div className="detail-meta">
            {/* category (mock) or type (backend) */}
            {(listing.category ?? (listing as any).type) && (
              <div className="meta-item">
                <div className="meta-label">Type</div>
                <div className="meta-value">
                  {(listing.category ?? (listing as any).type as string).charAt(0).toUpperCase()
                    + (listing.category ?? (listing as any).type as string).slice(1).toLowerCase()}
                </div>
              </div>
            )}
            {/* guests (backend only) */}
            {(listing as any).guests != null && (
              <div className="meta-item">
                <div className="meta-label">Max guests</div>
                <div className="meta-value">{(listing as any).guests}</div>
              </div>
            )}
            {/* availableFrom is mock-only; hide when missing */}
            {listing.availableFrom && (
              <div className="meta-item">
                <div className="meta-label">Available from</div>
                <div className="meta-value">
                  {format(new Date(listing.availableFrom), "MMM d, yyyy")}
                </div>
              </div>
            )}
            {listing.available != null && (
              <div className="meta-item">
                <div className="meta-label">Status</div>
                <div className={`meta-value status ${listing.available ? "available" : "booked"}`}>
                  {listing.available ? "Available" : "Booked"}
                </div>
              </div>
            )}
          </div>

          <div className="detail-pricing">
            <div className="price-display">
              <span className="price-amount">{numeral(listing.price).format("$0")}</span>
              <span className="price-period">/night</span>
            </div>
          </div>

          {listing.available && (
            <Link to={`/book/${listing.id}`} className="detail-action-button">
              Reserve · {numeral(listing.price).format("$0")}/night
            </Link>
          )}

          <Link to="/bookings" className="guest-section-link">
            View my bookings
          </Link>
        </div>
      </div>

      <div className="detail-container">
        <ReviewsSection listingId={listing.id} />
      </div>

      {/* ── Lightbox ── */}
      {lightbox !== null && (
        <div className="lightbox-overlay" onClick={() => setLightbox(null)}>
          <button className="lb-close" onClick={() => setLightbox(null)}><IoClose /></button>
          <button className="lb-counter">{lightbox + 1} / {photos.length}</button>

          {lightbox > 0 && (
            <button className="lb-prev" onClick={(e) => { e.stopPropagation(); prevPhoto(); }}>
              <IoChevronBack />
            </button>
          )}

          <img
            src={photos[lightbox]}
            alt={`Photo ${lightbox + 1}`}
            className="lb-img"
            onClick={(e) => e.stopPropagation()}
          />

          {lightbox < photos.length - 1 && (
            <button className="lb-next" onClick={(e) => { e.stopPropagation(); nextPhoto(); }}>
              <IoChevronForward />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
