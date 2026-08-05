import StaticLegalPage from "../components/public/StaticLegalPage";
import { createStaticPublicPageMetadata } from "../../lib/seo/static-public-page";

export const generateMetadata = () => createStaticPublicPageMetadata("privacy", "/privacy", { noindex: true });
export default function PrivacyPage() { return <StaticLegalPage page="privacy" canonicalPath="/privacy" />; }
