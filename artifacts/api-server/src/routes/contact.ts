import { Router, type IRouter } from "express";
import { db, contactMessagesTable } from "@workspace/db";
import { SendContactBody, SendContactResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/contact", async (req, res): Promise<void> => {
  const parsed = SendContactBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [message] = await db.insert(contactMessagesTable).values(parsed.data).returning();
  res.status(201).json(SendContactResponse.parse({
    ...message,
    submittedAt: message.submittedAt.toISOString(),
  }));
});

export default router;
