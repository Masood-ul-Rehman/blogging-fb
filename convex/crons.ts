import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/**
 * Check and refresh Facebook tokens that are expiring soon
 * Runs daily at 3:00 AM UTC
 */
crons.daily(
  "refresh-facebook-tokens",
  {
    hourUTC: 3,
    minuteUTC: 0,
  },
  internal.facebook.internal.refreshExpiringTokens
);

export default crons;
