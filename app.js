const express = require("express");
const puppeteer = require("puppeteer");
const cron = require("node-cron");

const app = express();

// Code start
let counter = 0;
const screenshot = async () => {
  try {
    const browser = await puppeteer.launch({
      args: [
        "--start-maximized",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-notifications",
      ],
      timeout: 0,
    });
    const page = await browser.newPage();
    await page.goto("https://www.sportybet.com/ng/sport/vFootball/", {
      waitUntil: "networkidle2",
      timeout: 0,
    });

    await page.evaluate(() => {
      const liveBanner = document.querySelector(".live-banner");
      const livePage = liveBanner.querySelector(".league-title");
      livePage.click();
    });

    await new Promise((resolve) => {
      setTimeout(() => {
        resolve("");
      }, 3000);
    });

    const name = new Date().toISOString().replace(/:/g, "-");
    const path = `screenshots/${counter}sporty-${name}.png`;
    await page.screenshot({
      path: path,
      fullPage: true,
    });

    await browser.close();
    counter++;
  } catch (err) {
    console.log(err.message);
  }
};

cron.schedule("*/1 * * * *", () => {
  screenshot();
});
// screenshot();
// Code End

const port = 3033;

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});
