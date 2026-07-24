import { describe, expect, it } from "vitest";
import { canAccessDocument } from "@/lib/access";

const doc = { ownerId: "owner-1" };
const shares = [
  { userId: "viewer-1", permission: "VIEW" as const },
  { userId: "editor-1", permission: "EDIT" as const },
];

describe("canAccessDocument", () => {
  it("grants full access to the owner", () => {
    const result = canAccessDocument(doc, shares, "owner-1");
    expect(result).toEqual({ isOwner: true, canView: true, canEdit: true });
  });

  it("grants view-only access to a VIEW share", () => {
    const result = canAccessDocument(doc, shares, "viewer-1");
    expect(result).toEqual({ isOwner: false, canView: true, canEdit: false });
  });

  it("grants view+edit access to an EDIT share", () => {
    const result = canAccessDocument(doc, shares, "editor-1");
    expect(result).toEqual({ isOwner: false, canView: true, canEdit: true });
  });

  it("denies access to a user with no relation to the document", () => {
    const result = canAccessDocument(doc, shares, "stranger-1");
    expect(result).toEqual({ isOwner: false, canView: false, canEdit: false });
  });

  it("denies access when no user is signed in", () => {
    expect(canAccessDocument(doc, shares, null)).toEqual({ isOwner: false, canView: false, canEdit: false });
    expect(canAccessDocument(doc, shares, undefined)).toEqual({ isOwner: false, canView: false, canEdit: false });
  });

  it("denies access when the document has no shares at all", () => {
    expect(canAccessDocument(doc, [], "anyone")).toEqual({ isOwner: false, canView: false, canEdit: false });
  });
});
