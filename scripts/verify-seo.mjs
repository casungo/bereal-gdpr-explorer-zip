import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const origin = "https://berealgdprviewer.eu";
const home = readFileSync("dist/index.html", "utf8");
const guide = readFileSync("dist/how-to-export-bereal/index.html", "utf8");
const error = readFileSync("dist/404.html", "utf8");
const sitemap = readFileSync("dist/sitemap-0.xml", "utf8");
for (const [html, path] of [
  [home, "/"],
  [guide, "/how-to-export-bereal/"],
]) {
  assert.match(html, /<html lang="en"/);
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
  assert.ok(html.includes(`rel="canonical" href="${origin}${path}"`));
  assert.ok(html.includes(`property="og:url" content="${origin}${path}"`));
  assert.ok(!html.includes("hreflang"), "Only English is published");
  assert.ok(!html.includes('content="noindex'));
}
for (const phrase of [
  "Supported files and limits",
  "500 MiB",
  "No account",
  "Download complete archive",
  "Questions before opening",
]) {
  assert.ok(home.includes(phrase), `${phrase} must exist before hydration`);
}
assert.ok(guide.includes('href="/#open-archive"'));
assert.ok(home.includes('href="/how-to-export-bereal/"'));
assert.ok(error.includes('content="noindex, follow"'));
assert.ok(!error.includes('rel="canonical"'));
assert.ok(!error.includes("application/ld+json"));
assert.ok(
  !guide.includes("application/ld+json"),
  "Guide is not an application",
);
const json = JSON.parse(
  home.match(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/s)[1],
);
assert.equal(json["@type"], "WebApplication");
assert.equal(json.url, origin + "/");
assert.equal(json.offers.price, "0");
assert.ok(!json.aggregateRating && !json.review);
assert.deepEqual(
  [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]).sort(),
  [origin + "/", origin + "/how-to-export-bereal/"].sort(),
);
assert.ok(!sitemap.includes("lastmod"), "No invented build timestamps");
assert.ok(
  readFileSync("dist/robots.txt", "utf8").includes(
    origin + "/sitemap-index.xml",
  ),
);

// Exercise the real service worker against offline navigation and online errors.
const offlineHome = new Response("Cached home");
const context = vm.createContext({
  URL,
  Response,
  self: { addEventListener() {}, location: { origin }, skipWaiting() {} },
  caches: { match: async () => offlineHome },
  fetch: async () => {
    throw new Error("Offline");
  },
});
vm.runInContext(readFileSync("public/sw.js", "utf8"), context);
assert.equal(
  await vm.runInContext(`navigationResponse({url: '${origin}/'})`, context),
  offlineHome,
);
assert.equal(
  (
    await vm.runInContext(
      `navigationResponse({url: '${origin}/missing/'})`,
      context,
    )
  ).type,
  "error",
);
context.fetch = async () => new Response("Not found", { status: 404 });
assert.equal(
  (
    await vm.runInContext(
      `navigationResponse({url: '${origin}/missing/'})`,
      context,
    )
  ).status,
  404,
);
console.log(
  "SEO HTML, sitemap, schema and service worker navigation checks passed.",
);
