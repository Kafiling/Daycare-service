import { NavbarAdmin } from "@/components/navbarAdmin";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavbarAdmin />
      {children}
    </>
  );
}
