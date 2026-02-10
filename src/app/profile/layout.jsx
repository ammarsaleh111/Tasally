import { noIndexMetadata } from "@/lib/noindex";

export const metadata = {
  title: "Profile",
  ...noIndexMetadata,
};

export default function ProfileLayout({ children }) {
  return children;
}

