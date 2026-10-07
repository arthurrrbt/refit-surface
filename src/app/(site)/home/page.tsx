import { UniversPage, universMetadata } from "@/components/site/UniversPage";

export const metadata = universMetadata("home");

export default function HomePage() {
  return <UniversPage slug="home" />;
}