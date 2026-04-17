import { scrapeProduct } from './src/lib/features/scraper/scraper';

async function main() {
    const url = "https://www.amazon.in/dp/B0BDHWDR12/";
    console.log(`Scraping ${url}...`);
    const data = await scrapeProduct(url);
    console.log("Title: " + data.title);
    console.log("Primary Image: " + data.image);
    console.log("All Images Array: ");
    console.dir(data.images);
    console.log("Image count:", data.images?.length);
}

main().catch(console.error);
