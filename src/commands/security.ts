import type { RuntimeEnv } from "../runtime.js";
import { defaultRuntime } from "../runtime.js";
import { intro as clackIntro, outro as clackOutro } from "@clack/prompts";
import { loadConfig } from "../config/config.js";
import { info } from "../globals.js";
import { noteSecurityWarnings } from "./doctor-security.js";

interface SecurityAuditOptions {
  deep?: boolean;
}

export async function securityCommand(
  _runtime: RuntimeEnv = defaultRuntime,
  options: SecurityAuditOptions = {},
) {
  const cfg = loadConfig();

  clackIntro("Security Audit");

  // Run the security warnings check
  await noteSecurityWarnings(cfg);

  if (options.deep) {
    info("Deep security scan is not yet implemented.");
  }

  clackOutro("Security audit complete.");
}
