const express = require("express");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
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

    const data = await page.evaluate((TEAM) => {
      let minute;
      let teamChosed;
      let opponent;
      let teamIsHome;
      let scoreHome;
      let scoreAway;
      let found;
      const liveleagues = document.querySelectorAll(".live-match");
      for (const el of liveleagues) {
        const matches = el?.querySelectorAll(
          ".m-table-row.m-content-row.match-row.vFootball-row"
        );
        for (const el of matches) {
          const parentEl = el?.querySelector(".m-table-cell.left-team-cell");
          const matchEl = parentEl?.querySelector(".left-team-table");
          const timeParent = matchEl?.querySelector(".time");
          const time = timeParent?.querySelector(".clock-time");
          minute = time?.textContent;

          const scoreEl = matchEl?.querySelector(".score");
          const scoreItems = scoreEl?.querySelectorAll(".score-item");

          scoreHome = scoreItems[0]?.textContent.trim();
          scoreAway = scoreItems[1]?.textContent.trim();

          const teamsParent = matchEl.querySelector(".teams");
          const homeTeam = teamsParent.querySelector(".home-team");
          const awayTeam = teamsParent.querySelector(".away-team");

          if (homeTeam.textContent === TEAM) {
            teamChosed = homeTeam.textContent;
            opponent = awayTeam.textContent;
            found = true;
            teamIsHome = true;
            break;
          } else if (awayTeam.textContent === TEAM) {
            teamChosed = awayTeam.textContent;
            opponent = homeTeam.textContent;
            found = true;
            break;
          }
        }
        if (found) {
          break;
        }
      }
      return {
        minute,
        teamChosed,
        opponent,
        scoreHome,
        scoreAway,
        teamIsHome,
        found,
      };
    }, process.env.TEAM);

    if (!data.found) {
      return await browser.close();
    }

    const shotTime = new Date().toISOString().replace(/:/g, "-");
    const score = data.teamIsHome
      ? `${data.teamChosed}-${data.scoreHome}-vs-${data.scoreAway}-${data.opponent}`
      : `${data.opponent}-${data.scoreAway}-vs-${data.scoreHome}-${data.teamChosed}`;
    const path = `screenshots/${counter}sporty-${
      data.teamIsHome ? "HOME" : "AWAY"
    }-${score}-${data.minute.replace(":", "-")}-${shotTime}.png`;
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

const port = process.env.PORT || 3033;

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});
