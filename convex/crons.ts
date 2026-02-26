import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.cron("fetch daily x stats", "0 0 * * *", internal.xStats.fetchAndStore, {});
crons.cron("fetch daily api costs", "0 1 * * *", internal.costFetch.fetchAllDailyCosts, {});
crons.cron("fetch daily website stats", "5 0 * * *", internal.websiteStats.fetchAndStore, {});

export default crons;
