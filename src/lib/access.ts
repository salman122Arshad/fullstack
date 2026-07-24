export type Permission = "VIEW" | "EDIT";

export interface AccessDocument {
  ownerId: string;
}

export interface AccessShare {
  userId: string;
  permission: Permission;
}

export interface AccessResult {
  isOwner: boolean;
  canView: boolean;
  canEdit: boolean;
}

const NO_ACCESS: AccessResult = { isOwner: false, canView: false, canEdit: false };

/**
 * Pure authorization rule shared by every document API route:
 * owner -> full access; EDIT share -> view+edit; VIEW share -> view only;
 * no relation -> no access.
 */
export function canAccessDocument(
  doc: AccessDocument,
  shares: AccessShare[],
  userId: string | null | undefined
): AccessResult {
  if (!userId) return NO_ACCESS;
  if (doc.ownerId === userId) return { isOwner: true, canView: true, canEdit: true };

  const share = shares.find((s) => s.userId === userId);
  if (!share) return NO_ACCESS;

  return {
    isOwner: false,
    canView: true,
    canEdit: share.permission === "EDIT",
  };
}
