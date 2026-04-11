import { scrapeProduct } from './src/lib/features/scraper/scraper';

async function main() {
    const url = 'https://www.flipkart.com/urbx-men-women-cargos/p/itm354c3574e392e?pid=CRGHHC4HT...'; // Let me get the actual url from the image or use a generic one
    const res = await scrapeProduct('https://www.flipkart.com/urbx-men-women-cargos/p/itm354c3574e392e?pid=CRGHHC4HTSYQZNG&lid=LSTCRGHHC4HTSYQZNG5I5W96K&marketplace=FLIPKART&q=cargos&store=clo%2Fvua%2Fjhz&srno=s_1_1&otracker=search&fm=organic&iid=en_kL-I-l4n2k9W40n0wX4uB-w0E7v95rY6f0h7P05h8A&ppt=None&ppn=None&ssid=p2h9w6v1u80000001712850981774&qH=64e9e14a1fa');
    console.log(JSON.stringify(res, null, 2));
}

main().catch(console.error);
