const express = require("express");
const puppeteer = require("puppeteer");

let browser;
const initBrowser = async () => {
  try {
    console.log(`[${new Date().toISOString()}][SSR] puppeteer.launch`);
    browser = await puppeteer.launch({ headless: true });
  } catch (error) {
    console.log(error);
  }
};

initBrowser();

const ssr = async (url) => {
  if (!browser) initBrowser();
  const start = Date.now();
  console.log(`[${new Date().toISOString()}][SSR] puppeteer.browser.newPage`);
  const page = await browser.newPage();
  console.log(`[${new Date().toISOString()}][SSR] call ${url}`);
  await page.goto(url, { waitUntil: "networkidle0" });
  const html = await page.content(); // serialized HTML of page DOM.
  console.log(`[${new Date().toISOString()}][SSR] done ${url}`);
  await page.close();
  const ttRenderMs = Date.now() - start;
  console.log(`[${new Date().toISOString()}][SSR] ttRenderMs ${ttRenderMs}`);
  return { html, ttRenderMs };
};


const renderMiddleware = async (req, res, next) => {
  const { url } = req.query || {};
  try {
    console.log(`[${new Date().toISOString()}] init render ${url}`);
    const { html, ttRenderMs } = await ssr(url);
    // Add Server-Timing! See https://w3c.github.io/server-timing/.
    res.set(
      "Server-Timing",
      `Prerender;dur=${ttRenderMs};desc="Headless render time (ms)"`
    );
    console.log(`[${new Date().toISOString()}] rendered ${url}`);
    return res.status(200).send(html); // Serve prerendered page as response.
  } catch (error) {
    console.log(error);
    return res.status(500).send("something wrong");
  }
};

const app = express();
app.use("/", renderMiddleware);
app.disable("x-powered-by");

app.listen(8080, () => console.log("Server started. Press Ctrl+C to quit"));
