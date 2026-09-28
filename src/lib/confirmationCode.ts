/** Länge des Kurzcodes, den Gäste in der Bestätigung und per E-Mail sehen. */
export const CONFIRMATION_CODE_LENGTH = 8;

/** Aus der internen, langen ID wird der kurze, gut lesbare Bestätigungscode. */
export function shortConfirmationCode(fullCode: string): string {
  return fullCode.slice(-CONFIRMATION_CODE_LENGTH).toUpperCase();
}
