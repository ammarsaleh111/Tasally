import { noIndexMetadata } from "@/lib/noindex";

export const metadata = {
  title: "Groups",
  ...noIndexMetadata,
};

export default function GroupsLayout({ children }) {
  return children;
}

