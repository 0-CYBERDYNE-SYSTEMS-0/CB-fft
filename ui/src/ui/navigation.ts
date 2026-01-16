export const TAB_GROUPS = [
  { label: "Field", tabs: ["chat"] },
  {
    label: "Operations",
    tabs: ["overview", "connections", "instances", "sessions", "cron"],
  },
  { label: "Tools", tabs: ["skills", "nodes"] },
  { label: "System", tabs: ["config", "debug", "logs"] },
] as const;

export type Tab =
  | "overview"
  | "connections"
  | "instances"
  | "sessions"
  | "cron"
  | "skills"
  | "nodes"
  | "chat"
  | "config"
  | "debug"
  | "logs";

const TAB_PATHS: Record<Tab, string> = {
  overview: "/overview",
  connections: "/connections",
  instances: "/instances",
  sessions: "/sessions",
  cron: "/cron",
  skills: "/skills",
  nodes: "/nodes",
  chat: "/chat",
  config: "/config",
  debug: "/debug",
  logs: "/logs",
};

const PATH_TO_TAB = new Map(
  Object.entries(TAB_PATHS).map(([tab, path]) => [path, tab as Tab]),
);

export function normalizeBasePath(basePath: string): string {
  if (!basePath) return "";
  let base = basePath.trim();
  if (!base.startsWith("/")) base = `/${base}`;
  if (base === "/") return "";
  if (base.endsWith("/")) base = base.slice(0, -1);
  return base;
}

export function normalizePath(path: string): string {
  if (!path) return "/";
  let normalized = path.trim();
  if (!normalized.startsWith("/")) normalized = `/${normalized}`;
  if (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
}

export function pathForTab(tab: Tab, basePath = ""): string {
  const base = normalizeBasePath(basePath);
  const path = TAB_PATHS[tab];
  return base ? `${base}${path}` : path;
}

export function tabFromPath(pathname: string, basePath = ""): Tab | null {
  const base = normalizeBasePath(basePath);
  let path = pathname || "/";
  if (base) {
    if (path === base) {
      path = "/";
    } else if (path.startsWith(`${base}/`)) {
      path = path.slice(base.length);
    }
  }
  let normalized = normalizePath(path).toLowerCase();
  if (normalized.endsWith("/index.html")) normalized = "/";
  if (normalized === "/") return "chat";
  return PATH_TO_TAB.get(normalized) ?? null;
}

export function inferBasePathFromPathname(pathname: string): string {
  let normalized = normalizePath(pathname);
  if (normalized.endsWith("/index.html")) {
    normalized = normalizePath(normalized.slice(0, -"/index.html".length));
  }
  if (normalized === "/") return "";
  const segments = normalized.split("/").filter(Boolean);
  if (segments.length === 0) return "";
  for (let i = 0; i < segments.length; i++) {
    const candidate = `/${segments.slice(i).join("/")}`.toLowerCase();
    if (PATH_TO_TAB.has(candidate)) {
      const prefix = segments.slice(0, i);
      return prefix.length ? `/${prefix.join("/")}` : "";
    }
  }
  return `/${segments.join("/")}`;
}

export function iconForTab(tab: Tab): string {
  switch (tab) {
    case "chat":
      return "chat";
    case "overview":
      return "overview";
    case "connections":
      return "connections";
    case "instances":
      return "instances";
    case "sessions":
      return "sessions";
    case "cron":
      return "cron";
    case "skills":
      return "skills";
    case "nodes":
      return "nodes";
    case "config":
      return "config";
    case "debug":
      return "debug";
    case "logs":
      return "logs";
    default:
      return "default";
  }
}

export function titleForTab(tab: Tab) {
  switch (tab) {
    case "overview":
      return "Field Overview";
    case "connections":
      return "Channels";
    case "instances":
      return "Stations";
    case "sessions":
      return "Field Notes";
    case "cron":
      return "Routines";
    case "skills":
      return "Toolkits";
    case "nodes":
      return "Equipment";
    case "chat":
      return "Field Chat";
    case "config":
      return "Configuration";
    case "debug":
      return "Diagnostics";
    case "logs":
      return "Activity Log";
    default:
      return "Operations";
  }
}

export function subtitleForTab(tab: Tab) {
  switch (tab) {
    case "overview":
      return "System status, access points, and a quick health check.";
    case "connections":
      return "Link channels and keep routing settings aligned.";
    case "instances":
      return "Presence beacons from connected stations and gear.";
    case "sessions":
      return "Review recent runs and tune per-session defaults.";
    case "cron":
      return "Schedule routines and recurring runs.";
    case "skills":
      return "Manage toolkits and key access.";
    case "nodes":
      return "Paired devices, capabilities, and commands.";
    case "chat":
      return "Direct field chat for quick interventions.";
    case "config":
      return "Edit the system config safely.";
    case "debug":
      return "Snapshots, events, and manual calls.";
    case "logs":
      return "Live tail of the log file.";
    default:
      return "";
  }
}
