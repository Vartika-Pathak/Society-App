// Manually (re-)seeds the Social Calendar with a starter set of Indian festivals and
// community functions — usually not needed, since the API server seeds itself on
// startup, but useful if you want to run it directly against a specific database.
//
// Usage: pnpm --filter @workspace/scripts run seed-events
// (uses the same DATABASE_PATH / default data/pavilion.db as the API server —
// run this against whichever database your api-server is actually pointed at.)

import { seedEvents } from "@workspace/db";

const { inserted, skipped } = await seedEvents();
console.log(`Seeded events: ${inserted} inserted, ${skipped} already present (skipped).`);
