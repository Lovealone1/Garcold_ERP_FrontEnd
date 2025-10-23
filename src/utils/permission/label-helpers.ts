import { MODULE_LABELS, ACTION_LABELS } from "./permission-labels";

export function labelModule(code: string): string {
  return MODULE_LABELS[code] ?? code.replaceAll("_", " ");
}

export function labelAction(code: string): string {
  return ACTION_LABELS[code] ?? code.replaceAll("_", " ");
}
