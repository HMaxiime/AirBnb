import numeral from "numeral";
import { useCard } from "./Card";
import styles from "../ListingCard.module.css";

export function CardPrice(): React.JSX.Element {
  const { listing } = useCard();
  return (
    <div className={styles.cardPrice}>
      <span className={styles.price}>{numeral(listing.price).format("$0")}</span>
    </div>
  );
}
