import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.cron("fetch daily x stats", "0 0 * * *", internal.xStats.fetchAndStore, {});

export default crons;
