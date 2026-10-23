/** Replace `[CODE]` / `[MINUTES]` from templateVariables. Unknown tokens stay put. */
export function interpolate(
  text: string,
  templateVariables: Record<string, unknown> = {},
): string {
  if (!text) return text;
  return text.replace(/\[([A-Za-z0-9_]+)\]/g, (match, raw: string) => {
    if (templateVariables[raw] != null && templateVariables[raw] !== '') {
      return String(templateVariables[raw]);
    }
    const key = Object.keys(templateVariables).find(
      (name) => name.toLowerCase() === raw.toLowerCase(),
    );
    if (key != null && templateVariables[key] != null && templateVariables[key] !== '') {
      return String(templateVariables[key]);
    }
    return match;
  });
}
