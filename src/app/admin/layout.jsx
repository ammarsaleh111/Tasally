import { noIndexMetadata } from "@/lib/noindex";

export const metadata = {
  title: "Admin",
  ...noIndexMetadata,
};

export default function AdminLayout({ children }) {
  return children;
}

