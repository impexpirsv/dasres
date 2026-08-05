import StandardPublicPage from "../components/public/StandardPublicPage";
import { createStaticPublicPageMetadata } from "../../lib/seo/static-public-page";

export const generateMetadata = () => createStaticPublicPageMetadata("contact", "/contact");

export default function ContactPage() {
  return <StandardPublicPage page="contact" canonicalPath="/contact" cta={{ href: "/dashboard/tickets" }} />;
}
