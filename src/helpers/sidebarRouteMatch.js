/**
 * Sidebar menu route matching — highlights the correct list item on add/edit/child pages.
 */

const ACTION_WORDS = new Set([
  "list", "add", "edit", "create", "update", "form", "detail", "view", "print", "rpt", "report",
]);

const GENERIC_TOKENS = new Set([
  "master", "masters", "report", "reports", "data", "admin",
]);

const INVALID_MENU_PATHS = new Set(["/", "/#", ""]);

const TOKEN_ALIASES = {
  jewellerym: "jewmounting",
  jewellerystock: "jewmounting",
  mounting: "jewmounting",
  jewstock: "jewmounting",
  mountingstock: "jewmounting",
  jewellerymstock: "jewmounting",
  listmountingstock: "jewmounting",
  addstockmounting: "jewmounting",
  editmountingstock: "jewmounting",
  parcelitemmaster: "parcelitemmaster",
  parcelitem: "parcelitemmaster",
  parcelmaster: "parcelitemmaster",
  solitaireitemmaster: "solitaireitemmaster",
  solitaireitem: "solitaireitemmaster",
  listitem: "solitaireitemmaster",
  itemmaster: "solitaireitemmaster",
  accountgroup: "accountgroup",
  accountgroupmaster: "accountgroup",
  purchasereturn: "purchasereturn",
  salereturn: "salereturn",
  partyhold: "partyhold",
  consignment: "consignment",
  memo: "memo",
  mixpurchase: "mixpurchase",
  mixpurchasereturn: "mixpurchasereturn",
};

const normalizeActionSegment = (seg) =>
  seg
    .toLowerCase()
    .replace(/[-_]?(list|add|edit|create|update|form|detail|view|print|rpt|report)[s]?[-_]?/gi, "")
    .replace(/^(list|add|edit|create|update|form|detail|view|print|rpt|report)[s]?[-_]?/gi, "")
    .replace(/^[-_]+|[-_]+$/g, "");

export const getPathIdentifier = (url) => {
  if (!url || url === "/" || url === "/#") return "";
  const cleanUrl = url.toLowerCase().replace(/^\/+|\/+$/g, "");
  return cleanUrl
    .split("/")
    .map(normalizeActionSegment)
    .filter(Boolean)
    .join("/");
};

const canonicalToken = (token) => {
  const t = token.toLowerCase().replace(/s$/i, "");
  return TOKEN_ALIASES[t] || t;
};

const getMeaningfulTokens = (url) => {
  if (!url || url === "/" || url === "/#") return new Set();
  const tokens = new Set();
  const segments = url.toLowerCase().replace(/^\/+|\/+$/g, "").split("/");

  segments.forEach((seg) => {
    seg.split(/[-_]/).forEach((part) => {
      const p = part.toLowerCase().replace(/s$/i, "");
      if (p.length > 1 && !ACTION_WORDS.has(p) && !GENERIC_TOKENS.has(p)) {
        tokens.add(canonicalToken(p));
      }
    });

    const normalized = normalizeActionSegment(seg).replace(/[-_]/g, "");
    if (normalized.length > 2 && !GENERIC_TOKENS.has(normalized)) {
      tokens.add(canonicalToken(normalized));
    }
  });

  return tokens;
};

const getModuleKey = (url) => [...getMeaningfulTokens(url)].sort().join("|");

const isValidMenuPath = (pathname) => pathname && !INVALID_MENU_PATHS.has(pathname.toLowerCase());

const isMenuPathPrefix = (menuPath, currentPath) => {
  if (!isValidMenuPath(menuPath)) return false;
  const menu = menuPath.toLowerCase().replace(/\/+$/, "");
  const current = currentPath.toLowerCase();
  if (current === menu) return true;
  return current.startsWith(`${menu}/`);
};

const compareMenuItems = (a, b) => {
  const lenDiff = (b.pathname?.length || 0) - (a.pathname?.length || 0);
  if (lenDiff !== 0) return lenDiff;
  const segsA = (a.pathname || "").split("/").filter(Boolean).length;
  const segsB = (b.pathname || "").split("/").filter(Boolean).length;
  return segsB - segsA;
};

const scoreTokenOverlap = (currentTokens, menuTokens) => {
  let overlap = 0;
  currentTokens.forEach((t) => {
    if (menuTokens.has(t)) overlap += 1;
  });
  return overlap;
};

/**
 * Find the best sidebar <a> menu item for the current route.
 * @param {HTMLAnchorElement[]} itemsArray
 * @param {string} pathName - full pathname including PUBLIC_URL
 * @returns {HTMLAnchorElement|null}
 */
export function findMatchingMenuItem(itemsArray, pathName) {
  if (!itemsArray?.length || !pathName) return null;

  const validItems = itemsArray.filter((x) => isValidMenuPath(x.pathname));
  const lowerPath = pathName.toLowerCase();

  // 1. Exact match
  const exact = validItems.find((x) => x.pathname === pathName);
  if (exact) return exact;

  // 2. Longest valid prefix match (child routes under list route)
  const prefixMatches = validItems
    .filter((x) => isMenuPathPrefix(x.pathname, lowerPath))
    .sort(compareMenuItems);
  if (prefixMatches.length > 0) return prefixMatches[0];

  // 3. Normalized path identifier match — prefer deepest (leaf) menu link
  const currentId = getPathIdentifier(pathName);
  if (currentId) {
    const idMatches = validItems
      .filter((x) => {
        const menuId = getPathIdentifier(x.pathname);
        return menuId && menuId === currentId;
      })
      .sort(compareMenuItems);
    if (idMatches.length > 0) return idMatches[0];
  }

  // 4. Module token key (handles different prefixes e.g. /item/list-item vs /masters/add-solitaire-item-master)
  const currentModule = getModuleKey(pathName);
  if (currentModule) {
    const moduleMatches = validItems
      .filter((x) => getModuleKey(x.pathname) === currentModule)
      .sort(compareMenuItems);
    if (moduleMatches.length > 0) return moduleMatches[0];
  }

  // 5. Partial module overlap — prefer highest overlap + longest menu path
  const currentTokens = getMeaningfulTokens(pathName);
  if (currentTokens.size > 0) {
    const tokenMatches = validItems
      .map((x) => {
        const menuTokens = getMeaningfulTokens(x.pathname);
        const overlap = scoreTokenOverlap(currentTokens, menuTokens);
        if (overlap === 0) return null;
        return { item: x, overlap, pathLen: x.pathname.length };
      })
      .filter(Boolean)
      .sort((a, b) => b.overlap - a.overlap || b.pathLen - a.pathLen);

    if (tokenMatches.length > 0) {
      return tokenMatches[0].item;
    }
  }

  return null;
}
