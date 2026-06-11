"use client";

import Link from "next/link";

export default function NotificationLink({
  id,
  href,
  children,
}: {
  id: number;
  href: string;
  children: React.ReactNode;
}) {
  async function handleClick() {
    await fetch(
      `/api/notifications/${id}/read`,
      {
        method: "POST",
      }
    );
  }

  return (
    <Link href={href} onClick={handleClick}>
      {children}
    </Link>
  );
}