import { getTranslations } from "next-intl/server";

export async function getT(namespace: string) {
  return getTranslations(namespace);
}