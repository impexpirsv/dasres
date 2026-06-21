"use client";

export default function StopLinkClick({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {children}
    </div>
  );
}