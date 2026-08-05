import type { Metadata } from "next";

type PublicPageMetadataInput = {
  title: string;
  description: string;
  canonical?: string;
  robots?: Metadata["robots"];
};

export function createPublicPageMetadata({
  title,
  description,
  canonical,
  robots,
}: PublicPageMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: canonical ?? null,
    },
    openGraph: {
      title,
      description,
      ...(canonical ? { url: canonical } : {}),
    },
    twitter: {
      title,
      description,
    },
    ...(robots ? { robots } : {}),
  };
}

type PaginationMetadataState =
  | {
      isValid: true;
      canonical: string;
      page: number;
    }
  | {
      isValid: false;
      page: null;
    };

export function getPaginationMetadataState({
  pathname,
  rawPage,
  totalPages,
}: {
  pathname: string;
  rawPage: string | undefined;
  totalPages: number;
}): PaginationMetadataState {
  if (rawPage === undefined || rawPage === "1") {
    return {
      isValid: true,
      canonical: pathname,
      page: 1,
    };
  }

  if (!/^\d+$/.test(rawPage)) {
    return {
      isValid: false,
      page: null,
    };
  }

  const page = Number(rawPage);

  if (
    !Number.isSafeInteger(page) ||
    page < 2 ||
    page > totalPages
  ) {
    return {
      isValid: false,
      page: null,
    };
  }

  return {
    isValid: true,
    canonical: `${pathname}?page=${page}`,
    page,
  };
}
