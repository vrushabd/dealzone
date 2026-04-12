const { parse } = require('node-html-parser');

async function testSelectors(url) {
    console.log("Testing URL:", url);
    const res = await fetch(url, { headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    }});
    const html = await res.text();
    const root = parse(html);

    const title = (
        root.querySelector('.VU-Z7x')?.text?.trim()  ||
        root.querySelector('h1.yhB1nd')?.text?.trim() ||
        root.querySelector('.B_NuCI')?.text?.trim()   ||
        root.querySelector('._2W109w')?.text?.trim() || "None"
    );

    const price = (
        root.querySelector('.Nx9n0j')?.text  ||
        root.querySelector('._30jeq3')?.text ||
        root.querySelector('.hl05eU')?.text  ||
        root.querySelector('.Y1HWO0')?.text || "None"
    );

    console.log("Found Title:", title);
    console.log("Found Price:", price);
}

const url = "https://www.flipkart.com/jqr-signature-sneakers-men/p/itm1d93d5d82ea93";
testSelectors(url).catch(console.error);
