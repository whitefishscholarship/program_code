// Offline unit test for the SSRF guard (extract.ts assertFetchableUrl). No network.
// Run: npx tsx scripts/test-fetch-guard.ts
import { assertFetchableUrl } from "../src/lib/extract";

let failed = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  -> " + detail}`);
  if (!ok) failed++;
}
function rejects(url: string): boolean {
  try { assertFetchableUrl(url); return false; } catch { return true; }
}
function allows(url: string): boolean {
  try { assertFetchableUrl(url); return true; } catch { return false; }
}

// Must REJECT: internal / metadata / private / non-http(s)
check("rejects AWS metadata IP", rejects("http://169.254.169.254/latest/meta-data/"));
check("rejects localhost", rejects("http://localhost:3000/"));
check("rejects 127.0.0.1", rejects("http://127.0.0.1/"));
check("rejects 10.x private", rejects("http://10.1.2.3/x"));
check("rejects 192.168.x private", rejects("https://192.168.0.1/"));
check("rejects 172.16.x private", rejects("http://172.16.5.5/"));
check("rejects 172.31.x private", rejects("http://172.31.255.1/"));
check("rejects IPv6 loopback", rejects("http://[::1]/"));
check("rejects *.local", rejects("http://printer.local/"));
check("rejects file:// scheme", rejects("file:///etc/hostname"));
check("rejects gopher:// scheme", rejects("gopher://evil/"));
check("rejects 0.0.0.0", rejects("http://0.0.0.0/"));
check("rejects garbage", rejects("not a url"));

// Must ALLOW: normal public scholarship hosts
check("allows a normal https host", allows("https://www.thegatesscholarship.org/scholarship/"));
check("allows a normal http host", allows("http://reachhighermontana.org/"));
check("allows a public host that merely contains digits", allows("https://scholarship.aws.org/applications"));
// 172.32 is public (outside 172.16-31 private block)
check("allows 172.32.x (public range)", allows("http://172.32.0.1/"));

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
