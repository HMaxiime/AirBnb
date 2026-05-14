import { IoHeart, IoHeartOutline } from "react-icons/io5";
import clsx from "clsx";
import { useCard } from "./Card";
import styles from "../ListingCard.module.css";

const PLACEHOLDER = "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=70";

export function CardImage(): React.JSX.Element {
  const { listing, saved, onToggleSave, onImageError } = useCard();

  // listing.img is set by the adapter (first photo URL from backend).
  // Fall back to listing.photos[0] if img is a string array element,
  // and ultimately to a placeholder so the card never shows a broken image.
  const src =
    listing.img ||
    (Array.isArray(listing.photos) && typeof listing.photos[0] === "string"
      ? listing.photos[0]
      : undefined) ||
    PLACEHOLDER;

  return (
    <div className={styles.cardImageWrapper}>
      <img
        src={src}
        alt={listing.title}
        className={styles.cardImage}
        onError={onImageError}
      />
      <button
        className={clsx(styles.saveButton, { [styles.saved]: saved })}
        onClick={onToggleSave}
        aria-label={saved ? "Remove from saved" : "Add to saved"}
      >
        {saved ? <IoHeart /> : <IoHeartOutline />}
      </button>
    </div>
  );
}
