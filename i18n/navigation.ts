import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

// Use these helpers only for localized public destinations. Dashboard, auth and
// API destinations remain unprefixed and must use Next.js navigation directly.
export const {
  Link,
  redirect,
  usePathname,
  useRouter,
  getPathname,
} = createNavigation(routing);
