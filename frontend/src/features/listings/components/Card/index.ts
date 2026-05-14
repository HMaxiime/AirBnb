import { Card as CardRoot } from "./Card";
import { CardImage } from "./Card.Image";
import { CardTitle } from "./Card.Title";
import { CardLocation } from "./Card.Location";
import { CardPrice } from "./Card.Price";
import { CardRating } from "./Card.Rating";
import { CardBadge } from "./Card.Badge";

export { useCard } from "./Card";

export const Card = Object.assign(CardRoot, {
  Image: CardImage,
  Title: CardTitle,
  Location: CardLocation,
  Price: CardPrice,
  Rating: CardRating,
  Badge: CardBadge,
});
