import StaticLegalPage from "../components/public/StaticLegalPage";
import { createStaticPublicPageMetadata } from "../../lib/seo/static-public-page";

export const generateMetadata = () => createStaticPublicPageMetadata("cookies", "/cookies", { noindex: true });
export default function CookiesPage() { return <StaticLegalPage page="cookies" canonicalPath="/cookies" />; }
