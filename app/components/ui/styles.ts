export type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger";

export function buttonClassName(variant: ButtonVariant = "primary", className = ""): string {
  return `ui-button ui-button-${variant} ${className}`.trim();
}

export const cardClassName = "ui-card";
export const interactiveCardClassName = "ui-card ui-card-interactive";
export const fieldClassName = "ui-field";
export const checkboxClassName = "ui-checkbox";
export const badgeClassName = "ui-badge";
