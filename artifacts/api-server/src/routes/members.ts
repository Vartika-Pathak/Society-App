import { Router, type IRouter } from "express";
import { db, membersTable } from "@workspace/db";
import { ListMembersResponse, GetMemberParams, GetMemberResponse } from "@workspace/api-zod";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/members", async (_req, res): Promise<void> => {
  const members = await db.select().from(membersTable).orderBy(membersTable.joinedAt);
  res.json(ListMembersResponse.parse(members.map(m => ({
    ...m,
    joinedAt: m.joinedAt.toISOString(),
  }))));
});

router.get("/members/:id", async (req, res): Promise<void> => {
  const params = GetMemberParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [member] = await db.select().from(membersTable).where(eq(membersTable.id, params.data.id));
  if (!member) {
    res.status(404).json({ error: "Member not found" });
    return;
  }
  res.json(GetMemberResponse.parse({ ...member, joinedAt: member.joinedAt.toISOString() }));
});

export default router;
