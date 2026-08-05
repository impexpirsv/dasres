import StaticLegalPage from "../components/public/StaticLegalPage";
import { createStaticPublicPageMetadata } from "../../lib/seo/static-public-page";

export const generateMetadata = () => createStaticPublicPageMetadata("terms", "/terms", { noindex: true });
export default function TermsPage() { return <StaticLegalPage page="terms" canonicalPath="/terms" />; }
