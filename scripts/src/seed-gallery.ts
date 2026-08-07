// Manually (re-)seeds the gallery with a starter set of community photos — usually not
// needed, since the API server seeds itself on startup, but useful if you want to run it
// directly against a specific database.
//
// Usage: pnpm --filter @workspace/scripts run seed-gallery
// (uses the same DATABASE_PATH / default data/pavilion.db as the API server —
// run this against whichever database your api-server is actually pointed at.)

import { seedGallery } from "@workspace/db";

const { inserted, skipped } = await seedGallery();
console.log(`Seeded gallery photos: ${inserted} inserted, ${skipped} already present (skipped).`);
