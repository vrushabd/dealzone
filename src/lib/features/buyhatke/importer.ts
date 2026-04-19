/**
 * Buyhatke Price History Bootstrapper
 *
 * One-time importer that seeds historical price data from Buyhatke when a product
 * is first tracked. After the initial import, your own tracker collects fresh data.
 *
 * What we can reliably scrape from Buyhatke's SSR HTML (no JS needed):
 *  - predictedData field: "<ISO-date>~<price>~..." → earliest known price + date
 *  - cur_price: current price on Buyhatke
 *  - internalPid + platform slug for constructing the URL
 *
 * Strategy:
 *  1. Extract ASIN (Amazon) or PID (Flipkart) from the product URL
 *  2. Construct Buyhatke search URL and find their product page
 *  3. Scrape predictedData (start date + start price) and cur_price (today's snapshot)
 *  4. Bulk-insert those as ProductPriceHistory rows with platform = "buyhatke_import"
 */

const BUYHATKE_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

/** Extract the ASIN from an Amazon India URL */
function extractAsin(url: string): string | null {
  const m =
    url.match(/\/dp\/([A-Z0-9]{10})/) ||
    url.match(/\/gp\/product\/([A-Z0-9]{10})/) ||
    url.match(/([A-Z0-9]{10})(?:[/?]|$)/);
  return m ? m[1] : null;
}

/** Extract the Flipkart PID from a Flipkart URL */
function extractFlipkartPid(url: string): string | null {
  const m = url.match(/[?&]pid=([A-Z0-9]+)/i);
  return m ? m[1] : null;
}

interface BuyhatkeHistoryPoint {
  date: Date;
  price: number;
  platform: string; // "buyhatke_import"
}

/**
 * Fetch & parse a Buyhatke product page, returning up to 2 historical price points:
 *  [earliestKnown, currentSnapshot]
 *
 * Returns an empty array if Buyhatke doesn't have the product or parsing fails.
 */
async function scrapeBuyhatkeHistory(
  buyhatkeUrl: string
): Promise<BuyhatkeHistoryPoint[]> {
  try {
    const res = await fetch(buyhatkeUrl, {
      headers: {
        "User-Agent": BUYHATKE_UA,
        Accept: "text/html",
        Referer: "https://buyhatke.com/",
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) return [];
    const html = await res.text();
    const points: BuyhatkeHistoryPoint[] = [];

    // ── 1. Parse predictedData: "2024-10-20 05:58:57~57999~*~*&..." ──────────
    const pdMatch = html.match(/predictedData:"([^"]{10,})"/);
    if (pdMatch) {
      const raw = pdMatch[1]; // e.g. "2024-10-20 05:58:57~57999~*~*&~&~100&..."
      const parts = raw.split("~");
      if (parts.length >= 2) {
        const dateStr = parts[0].trim(); // "2024-10-20 05:58:57"
        const priceRaw = parseInt(parts[1], 10);
        const parsedDate = new Date(dateStr.replace(" ", "T") + "Z");
        if (!isNaN(parsedDate.getTime()) && priceRaw > 0) {
          points.push({
            date: parsedDate,
            price: priceRaw,
            platform: "buyhatke_import",
          });
        }
      }
    }

    // ── 2. Parse cur_price (today's snapshot from Buyhatke) ──────────────────
    // Only match cur_price from productData block (first occurrence = main product)
    const curMatch = html.match(/productData:\{[^}]+cur_price:(\d+)/);
    if (curMatch) {
      const curPrice = parseInt(curMatch[1], 10);
      const today = new Date();
      today.setHours(12, 0, 0, 0); // noon today

      // Add today's snapshot only if it's different from the earliest known price
      const firstPrice = points[0]?.price;
      if (curPrice > 0 && curPrice !== firstPrice) {
        points.push({
          date: today,
          price: curPrice,
          platform: "buyhatke_import",
        });
      }
    }

    return points;
  } catch {
    // Network error, timeout, etc. — fail silently
    return [];
  }
}

/**
 * Build the Buyhatke search URL for a product.
 * Buyhatke's /search/ page redirects to product page for exact ASIN matches.
 */
async function findBuyhatkeProductUrl(
  productUrl: string,
  platform: "amazon" | "flipkart"
): Promise<string | null> {
  try {
    let identifier: string | null = null;
    let storeId: number;

    if (platform === "amazon") {
      identifier = extractAsin(productUrl);
      storeId = 63;
    } else {
      identifier = extractFlipkartPid(productUrl);
      storeId = 2;
    }

    if (!identifier) return null;

    // Strategy: try Buyhatke's deals search - it performs a redirect for exact matches
    // We follow the redirect and land on the actual product page
    const searchUrl = `https://buyhatke.com/deals?q=${encodeURIComponent(identifier)}&store=${storeId}`;
    
    const res = await fetch(searchUrl, {
      headers: { "User-Agent": BUYHATKE_UA, Accept: "text/html" },
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
    });

    const finalUrl = res.url;
    // If it redirected to a product page (contains "price-in-india" pattern)
    if (finalUrl.includes("price-in-india") && finalUrl.includes("buyhatke.com")) {
      return finalUrl;
    }

    // If it didn't redirect, try to extract a product link from the search HTML
    const html = await res.text();
    const linkMatch = html.match(
      /href="(\/(?:amazon|flipkart)-[^"]+price-in-india-\d+-\d+)"/
    );
    if (linkMatch) {
      return `https://buyhatke.com${linkMatch[1]}`;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Main entry point: import historical price data from Buyhatke for a product.
 *
 * @param productUrl  - The original Amazon/Flipkart product URL
 * @param platform    - "amazon" | "flipkart"
 * @returns           - Array of {date, price} points to insert, or empty array
 */
export async function fetchBuyhatkeHistory(
  productUrl: string,
  platform: "amazon" | "flipkart" | "unknown"
): Promise<{ date: Date; price: number }[]> {
  if (platform === "unknown") return [];

  const bhUrl = await findBuyhatkeProductUrl(
    productUrl,
    platform as "amazon" | "flipkart"
  );
  if (!bhUrl) return [];

  const points = await scrapeBuyhatkeHistory(bhUrl);
  return points.map((p) => ({ date: p.date, price: p.price }));
}
