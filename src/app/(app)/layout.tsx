import { AppHeader } from "@/components/layout/app-header";
import { requireViewer } from "@/lib/auth/session";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const viewer = await requireViewer();
  return (
    <>
      <AppHeader viewer={viewer} />
      <div className="flex flex-1 flex-col">{children}</div>
    </>
  );
}
