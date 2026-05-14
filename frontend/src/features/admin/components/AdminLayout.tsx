import { ReactNode } from "react";
import { DashboardLayout } from "../../../shared/components/DashboardLayout";

interface Props { children: ReactNode }

export function AdminLayout({ children }: Props): React.JSX.Element {
  return <DashboardLayout>{children}</DashboardLayout>;
}
