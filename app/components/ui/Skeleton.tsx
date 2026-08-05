export default function Skeleton({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden="true" className={`ui-skeleton rounded-xl ${className}`} {...props} />;
}
