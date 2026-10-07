import { UniversPage, universMetadata } from "@/components/site/UniversPage";

export const metadata = universMetadata("pro");

export default function ProPage() {
  return <UniversPage slug="pro" />;
}