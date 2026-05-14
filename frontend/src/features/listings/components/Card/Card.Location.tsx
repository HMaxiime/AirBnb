import { useCard } from "./Card";
import styles from "../ListingCard.module.css";

export function CardLocation(): React.JSX.Element {
  const { listing } = useCard();
  return <p className={styles.cardLocation}>{listing.location}</p>;
}
