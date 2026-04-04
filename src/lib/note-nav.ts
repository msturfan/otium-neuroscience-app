/**
 * True on Otium (`/`) or Neuroscience composer when the URL note is not yet in the
 * sidebar list (fresh UUID / empty composer), matching "New note" nav highlighting.
 */
export function isNewNoteNavActive(
  pathname: string,
  noteId: string | null,
  knownNoteIds: Set<string> | null,
): boolean {
  const onNoteComposer =
    pathname === "/" ||
    pathname.startsWith("/neuroplasticity") ||
    pathname.startsWith("/workout");
  if (!onNoteComposer) return false;
  if (!noteId) return true;
  if (knownNoteIds === null) return false;
  return !knownNoteIds.has(noteId);
}

/**
 * Hide the header overflow menu until sidebar note IDs are known; then hide only for
 * composers whose `noteId` is not in that list (new/unsaved draft). Avoids a flash
 * of the menu while `knownNoteIds` is still loading.
 */
export function shouldHideComposerOverflowMenu(
  pathname: string,
  noteId: string | null,
  knownNoteIds: Set<string> | null,
): boolean {
  const onNoteComposer =
    pathname === "/" ||
    pathname.startsWith("/neuroplasticity") ||
    pathname.startsWith("/workout");
  if (!onNoteComposer) return false;
  if (!noteId) return true;
  if (knownNoteIds === null) return true;
  return !knownNoteIds.has(noteId);
}
