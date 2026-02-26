/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as apps from "../apps.js";
import type * as costFetch from "../costFetch.js";
import type * as crons from "../crons.js";
import type * as dailyUsage from "../dailyUsage.js";
import type * as providers_anthropic from "../providers/anthropic.js";
import type * as providers_openrouter from "../providers/openrouter.js";
import type * as providers_xai from "../providers/xai.js";
import type * as trackedKeys from "../trackedKeys.js";
import type * as websiteStats from "../websiteStats.js";
import type * as xStats from "../xStats.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  apps: typeof apps;
  costFetch: typeof costFetch;
  crons: typeof crons;
  dailyUsage: typeof dailyUsage;
  "providers/anthropic": typeof providers_anthropic;
  "providers/openrouter": typeof providers_openrouter;
  "providers/xai": typeof providers_xai;
  trackedKeys: typeof trackedKeys;
  websiteStats: typeof websiteStats;
  xStats: typeof xStats;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
