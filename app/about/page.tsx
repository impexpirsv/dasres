import StandardPublicPage from "../components/public/StandardPublicPage";
import { createStaticPublicPageMetadata } from "../../lib/seo/static-public-page";

export const generateMetadata = () => createStaticPublicPageMetadata("about", "/about");

export default function AboutPage() {
  return <StandardPublicPage page="about" canonicalPath="/about" cta={{ href: "/companies" }} />;
}
