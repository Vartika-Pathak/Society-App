import { seedEvents } from "@workspace/db";
import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Idempotent (checks by title before inserting), so this is a cheap no-op on every
// restart after the first — exists so a fresh deploy (e.g. on Render, which has no
// shell access on the free tier to run a one-off seed script) ends up with a
// populated Social Calendar without any extra manual step.
seedEvents()
  .then(({ inserted, skipped }) => {
    if (inserted > 0) {
      logger.info({ inserted, skipped }, "Seeded Social Calendar events");
    }
  })
  .catch((err) => {
    logger.error({ err }, "Failed to seed Social Calendar events");
  });

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
