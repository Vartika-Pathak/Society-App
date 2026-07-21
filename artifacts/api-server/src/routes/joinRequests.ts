import { Router, type IRouter } from "express";
import { db, joinRequestsTable } from "@workspace/db";
import { SubmitJoinRequestBody, SubmitJoinRequestResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/join-requests", async (req, res): Promise<void> => {
  const parsed = SubmitJoinRequestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [request] = await db.insert(joinRequestsTable).values(parsed.data).returning();
  res.status(201).json(SubmitJoinRequestResponse.parse({
    ...request,
    submittedAt: request.submittedAt.toISOString(),
  }));
});

export default router;
