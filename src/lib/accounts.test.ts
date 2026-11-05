import { describe, it, expect, beforeAll } from "vitest";
import { createPgliteDb, type Db } from "@/db";
import {
  AccountError, acceptInvite, changeRole, createInvite, createSession, deleteSession, findInvite,
  listMembers, removeMember, resolveSession, signUp, switchCompany, verifyCredentials,
} from "./accounts";

let db: Db;
beforeAll(async () => { db = await createPgliteDb("memory://"); });

const owner = { name: "Dana Ortiz", email: "Dana@CoolAir.example", password: "longpassword1", companyName: "Cool Air HVAC", trades: ["hvac" as const] };

describe("sign-up and login", () => {
  it("creates a user, a trialing company and an owner membership", async () => {
    const { userId, companyId } = await signUp(db, owner);
    const members = await listMembers(db, companyId);
    expect(members).toHaveLength(1);
    expect(members[0]).toMatchObject({ userId, role: "owner", email: "dana@coolair.example" });
  });

  it("refuses a second account with the same email", async () => {
    await expect(signUp(db, { ...owner, email: "dana@coolair.example" })).rejects.toBeInstanceOf(AccountError);
  });

  it("checks passwords", async () => {
    expect(await verifyCredentials(db, "DANA@coolair.example", "longpassword1")).not.toBeNull();
    expect(await verifyCredentials(db, "dana@coolair.example", "wrong-password")).toBeNull();
    expect(await verifyCredentials(db, "nobody@example.com", "longpassword1")).toBeNull();
  });

  it("resolves and ends sessions", async () => {
    const user = (await verifyCredentials(db, owner.email, owner.password))!;
    const { token } = await createSession(db, user.id, null);
    const ctx = await resolveSession(db, token);
    expect(ctx?.company?.name).toBe("Cool Air HVAC");
    expect(ctx?.role).toBe("owner");
    await deleteSession(db, token);
    expect(await resolveSession(db, token)).toBeNull();
    expect(await resolveSession(db, "garbage")).toBeNull();
  });
});

describe("companies stay separate", () => {
  it("a user only sees companies they belong to and cannot switch into others", async () => {
    const a = await signUp(db, { ...owner, email: "a@shop-a.example", companyName: "Shop A" });
    const b = await signUp(db, { ...owner, email: "b@shop-b.example", companyName: "Shop B" });
    const { token } = await createSession(db, a.userId, b.companyId);
    const ctx = await resolveSession(db, token);
    expect(ctx?.company?.id).toBe(a.companyId); // falls back to own company, never B
    expect(await switchCompany(db, token, a.userId, b.companyId)).toBe(false);
    await expect(removeMember(db, a.companyId, "owner", (await listMembers(db, b.companyId))[0].membershipId)).rejects.toBeInstanceOf(AccountError);
  });
});

describe("team invites and roles", () => {
  it("invites a tech who joins with a new account; the link works once", async () => {
    const co = await signUp(db, { ...owner, email: "boss@fixit.example", companyName: "FixIt" });
    const token = await createInvite(db, { companyId: co.companyId, email: "Tech@FixIt.example", role: "tech", invitedBy: co.userId, actorRole: "owner" });
    expect((await findInvite(db, token))?.companyName).toBe("FixIt");
    const joined = await acceptInvite(db, token, { name: "Sam Tech", password: "techpassword" });
    expect(joined.companyId).toBe(co.companyId);
    expect((await listMembers(db, co.companyId)).map((m) => m.role).sort()).toEqual(["owner", "tech"]);
    await expect(acceptInvite(db, token, { name: "Again", password: "techpassword" })).rejects.toBeInstanceOf(AccountError);
  });

  it("rejects an invite opened by a signed-in user with a different email", async () => {
    const co = await signUp(db, { ...owner, email: "boss2@fixit.example", companyName: "FixIt 2" });
    const other = await signUp(db, { ...owner, email: "other@else.example", companyName: "Else" });
    const token = await createInvite(db, { companyId: co.companyId, email: "invited@fixit.example", role: "admin", invitedBy: co.userId, actorRole: "owner" });
    await expect(acceptInvite(db, token, { userId: other.userId, email: "other@else.example" })).rejects.toBeInstanceOf(AccountError);
  });

  it("enforces role permissions and keeps at least one owner", async () => {
    const co = await signUp(db, { ...owner, email: "solo@one.example", companyName: "Solo" });
    const [me] = await listMembers(db, co.companyId);
    await expect(changeRole(db, co.companyId, "owner", me.membershipId, "tech")).rejects.toThrow(/at least one owner/);
    await expect(removeMember(db, co.companyId, "owner", me.membershipId)).rejects.toThrow(/at least one owner/);
    await expect(createInvite(db, { companyId: co.companyId, email: "x@one.example", role: "owner", invitedBy: co.userId, actorRole: "admin" })).rejects.toBeInstanceOf(AccountError);
    await expect(changeRole(db, co.companyId, "admin", me.membershipId, "tech")).rejects.toThrow(/permission/);
  });
});
