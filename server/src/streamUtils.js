// Referer mirrors with auth_key are minted for 1xapi's egress IP — always 403 from our proxy.
const IP_LOCKED_HOSTS = /sla\.homes|camel4\.live|liveplay\d*\.camel4/i;

export function isIpLockedCdn(server) {
  const url = (server?.url || "").split("|")[0];
  if (!url) return false;
  if (server?.type === "referer" && /[?&]auth_key=/i.test(url)) return true;
  if (IP_LOCKED_HOSTS.test(url)) return true;
  return false;
}
