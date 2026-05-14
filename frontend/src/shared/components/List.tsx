import { Fragment, ReactNode } from "react";
import { Spinner } from "./Spinner";

interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T) => string | number;
  emptyMessage?: string;
  loading?: boolean;
  className?: string;
}

export function List<T>({ items, renderItem, keyExtractor, emptyMessage, loading, className }: ListProps<T>): React.JSX.Element {
  if (loading) return <Spinner />;

  if (items.length === 0) {
    return (
      <p style={{ color: "#717171", fontSize: 14, textAlign: "center", padding: "40px 0" }}>
        {emptyMessage ?? "No items to display."}
      </p>
    );
  }

  return (
    <div className={className}>
      {items.map((item, index) => (
        <Fragment key={keyExtractor(item)}>
          {renderItem(item, index)}
        </Fragment>
      ))}
    </div>
  );
}
