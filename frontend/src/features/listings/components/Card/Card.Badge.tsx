import { useCard } from "./Card";

export function CardBadge(): React.JSX.Element | null {
  useCard(); // keeps context wiring intact
  return null;
}
