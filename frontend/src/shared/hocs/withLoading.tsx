import { ComponentType } from "react";
import { Spinner } from "../components/Spinner";

export function withLoading<P extends object>(
  Component: ComponentType<P>,
): ComponentType<P & { isLoading: boolean }> {
  function WithLoading({ isLoading, ...props }: P & { isLoading: boolean }): React.JSX.Element {
    if (isLoading) return <Spinner />;
    return <Component {...(props as P)} />;
  }
  WithLoading.displayName = `withLoading(${Component.displayName ?? Component.name})`;
  return WithLoading;
}
