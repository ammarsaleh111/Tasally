import { noIndexMetadata } from "@/lib/noindex";

export const metadata = {
  title: "Badges",
  ...noIndexMetadata,
};

export default function BadgesLayout({ children }) {
  return children;
}

