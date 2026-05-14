import { useCard } from "./Card";
import styles from "../ListingCard.module.css";

export function CardTitle(): React.JSX.Element {
  const { listing } = useCard();
  return <h3 className={styles.cardTitle}>{listing.title}</h3>;
}
