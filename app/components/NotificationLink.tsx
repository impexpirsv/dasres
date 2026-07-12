"use client";

import { useRouter } from "next/navigation";

export default function NotificationLink({
  id,
  href,
  children,
}: {
  id: number;
  href: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  async function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();

    await fetch(`/api/notifications/${id}/read`, {
      method: "POST",
    });

    router.push(href);
    router.refresh();
  }

  return (
    <a href={href} onClick={handleClick} className="block">
      {children}
    </a>
  );
}