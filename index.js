const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors'); // Import CORS middleware

const app = express();
const port = 3000;

// Enable CORS for all routes
app.use(cors());

let weatherData = {
    pm25: "Data not yet retrieved",
    temperature: "Data not yet retrieved",
    humidity: "Data not yet retrieved"
};

// Function to scrape data from the target webpage
async function scrapeData() {
    let browser;
    try {
        // Launch Puppeteer with necessary flags
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.goto(
            'http://203.158.3.33:8080/dashboard/5b4f1ef0-e4cb-11ee-b299-ff61c1d765cc?publicId=08bf5470-e176-11ec-8a17-851da87c6480',
            { waitUntil: 'networkidle0' }
        );

        // Extract data from the page
        const data = await page.evaluate(() => {
            const pm25 = document.querySelector('.value') ? document.querySelector('.value').innerText : 'No data found';
            const temperature = document.querySelectorAll('.value')[1] ? document.querySelectorAll('.value')[1].innerText : 'No data found';
            const humidity = document.querySelectorAll('.value')[2] ? document.querySelectorAll('.value')[2].innerText : 'No data found';
            return { pm25, temperature, humidity };
        });

        weatherData = data; // Update weatherData
    } catch (error) {
        console.error("Error during scraping:", error);
    } finally {
        if (browser) {
            await browser.close(); // Ensure browser is closed
        }
    }
}


// Schedule scraping every 5 seconds
setInterval(() => {
    scrapeData().catch(console.error);
}, 60000);

// Endpoint to get weather data
app.get('/weather', (req, res) => {
    res.json(weatherData);
});

// Root endpoint for testing
app.get('/', (req, res) => {
    res.send("Weather API. Use /weather to get PM2.5, temperature, and humiditymidity data.");
});
// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});