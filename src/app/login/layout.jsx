import { noIndexMetadata } from "@/lib/noindex";

export const metadata = {
  title: "Login",
  ...noIndexMetadata,
};

export default function LoginLayout({ children }) {
  return children;
}

