import { memo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import numeral from "numeral";
import { IoHeart, IoHeartOutline } from "react-icons/io5";
import { IoStar } from "react-icons/io5";
import { IoLocationSharp } from "react-icons/io5";
import clsx from "clsx";
import { Listing } from "../types";
import { useFavorites } from "../hooks/useFavorites";
import styles from "./ListingCard.module.css";

interface ListingCardProps {
  listing: Listing;
}

function ListingCardComponent({ listing }: ListingCardProps) {
  const { toggle, isSaved } = useFavorites();
  const saved = isSaved(listing.id);
  const [imgBroken, setImgBroken] = useState(false);

  if (imgBroken) return null;

  const formattedPrice = numeral(listing.price).format("$0");
  const formattedRating = numeral(listing.rating).format("0.00");
  const formattedDate = format(new Date(listing.availableFrom), "MMM dd, yyyy");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Link to={`/listings/${listing.id}`} className={styles.cardLink}>
        <div
          className={clsx(styles.listingCard, {
            [styles.superhost]: listing.superhost,
          })}
        >
          <div className={styles.cardImageWrapper}>
            <img
              src={listing?.photos[0]}
              alt={listing.title}
              className={styles.cardImage}
              onError={() => setImgBroken(true)}
            />
            <button
              className={clsx(styles.saveButton, {
                [styles.saved]: saved,
              })}
              onClick={(e) => {
                e.preventDefault();
                toggle(listing.id, listing.title);
              }}
              aria-label={saved ? "Remove from saved" : "Add to saved"}
            >
              {saved ? <IoHeart /> : <IoHeartOutline />}
            </button>

            {listing.superhost && (
              <div className={styles.superhostBadge}> Superhost</div>
            )}

            {listing.price > 300 && (
              <div className={styles.luxuryTag}>Luxury</div>
            )}
          </div>

          <div className={styles.cardContent}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>{listing.title}</h3>
              <div className={styles.cardRating}>
                <IoStar className={styles.starIcon} />
                <span>{formattedRating}</span>
              </div>
            </div>

            <div className={styles.cardLocation}>
              <IoLocationSharp className={styles.locationIcon} />
              <span>{listing.location}</span>
            </div>

            <div className={styles.cardAvailability}>
              <span
                className={clsx(styles.availabilityStatus, {
                  [styles.available]: listing.available,
                  [styles.booked]: !listing.available,
                })}
              >
                {listing.available ? "Available" : "Booked"}
              </span>
              <span className={styles.availabilityDate}>
                from {formattedDate}
              </span>
            </div>

            <div className={styles.cardFooter}>
              <div className={styles.cardPrice}>
                <span className={styles.price}>{formattedPrice}</span>
                <span className={styles.pricePeriod}>/night</span>
              </div>
              <span className={styles.categoryBadge}>{listing.category}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export const ListingCard = memo(ListingCardComponent);
