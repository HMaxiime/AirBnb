import numeral from "numeral";
import { IoStar } from "react-icons/io5";
import { useCard } from "./Card";
import styles from "../ListingCard.module.css";

export function CardRating(): React.JSX.Element {
  const { listing } = useCard();
  return (
    <div className={styles.cardRating}>
      <IoStar className={styles.starIcon} />
      <span>{numeral(listing.rating).format("0.00")}</span>
    </div>
  );
}
