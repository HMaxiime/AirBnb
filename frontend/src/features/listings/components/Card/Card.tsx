import { createContext, useContext, useState, ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useFavorites } from "../../hooks/useFavorites";
import { ExtendedListing } from "../../../../lib/api";
import styles from "../ListingCard.module.css";

interface CardContextType {
  listing: ExtendedListing;
  saved: boolean;
  onToggleSave: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onImageError: () => void;
}

const CardContext = createContext<CardContextType | undefined>(undefined);

export function useCard(): CardContextType {
  const ctx = useContext(CardContext);
  if (!ctx) throw new Error("useCard must be used within a <Card> component");
  return ctx;
}

interface CardProps {
  listing: ExtendedListing;
  children: ReactNode;
  asLink?: boolean;
}

export function Card({ listing, children, asLink = true }: CardProps): React.JSX.Element | null {
  const [imgBroken, setImgBroken] = useState<boolean>(false);
  const { isSaved, toggle } = useFavorites();

  // Don't hide the card on a broken image — just let CardImage show its placeholder.

  const saved = isSaved(listing.id);

  const onToggleSave = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault();
    toggle(listing.id, listing.title);
  };

  const inner = (
    <div className={`${styles.listingCard}${listing.superhost ? ` ${styles.superhost}` : ""}`}>
      {children}
    </div>
  );

  return (
    <CardContext.Provider value={{ listing, saved, onToggleSave, onImageError: () => setImgBroken(true) }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }}>
        {asLink ? (
          <Link to={`/listings/${listing.id}`} className={styles.cardLink}>{inner}</Link>
        ) : (
          inner
        )}
      </motion.div>
    </CardContext.Provider>
  );
}
