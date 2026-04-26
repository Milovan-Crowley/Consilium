import { startServer } from './server.js';

startServer().catch((err) => {
  // Telemetry redacts; this stderr line should not include the key.
  process.stderr.write(`consilium-principales: failed to start: ${err.message}\n`);
  process.exit(1);
});
