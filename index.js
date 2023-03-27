const puppeteer = require('puppeteer');
const {parseISO, compareAsc, isBefore, format} = require('date-fns')
require('dotenv').config();

const {delay, sendSlackMessage, logStep, appointmentURL} = require('./utils');
const {siteInfo, loginCred, IS_PROD, NEXT_SCHEDULE_POLL, MAX_NUMBER_OF_POLL, NOTIFY_ON_DATE_BEFORE, LOCATION_MAP} = require('./config');

let isLoggedIn = false;
let maxTries = MAX_NUMBER_OF_POLL

const login = async (page) => {
  logStep('logging in');
  await page.goto(siteInfo.LOGIN_URL);

  const form = await page.$("form#sign_in_form");

  const email = await form.$('input[name="user[email]"]');
  const password = await form.$('input[name="user[password]"]');
  const privacyTerms = await form.$('input[name="policy_confirmed"]');
  const signInButton = await form.$('input[name="commit"]');

  await email.type(loginCred.EMAIL);
  await password.type(loginCred.PASSWORD);
  await privacyTerms.click();
  await signInButton.click();

  await page.waitForNavigation();

  return true;
}

const notifyMe = async (earliestDate, locId) => {
  const formattedDate = format(earliestDate, 'dd-MM-yyyy');
  logStep(`sending an email to schedule for ${formattedDate}`);
  console.log(LOCATION_MAP[locId])
  await sendSlackMessage({
    subject: `We found an earlier date ${formattedDate}`,
    text: `Hurry and schedule for ${formattedDate} in ${LOCATION_MAP[locId]} before it is taken.`
  })
}

const checkForSchedules = async (page, url) => {
  logStep('checking for schedules');
  await page.goto(url);

  const originalPageContent = await page.content();
  const bodyText = await page.evaluate(() => {
    return document.querySelector('body').innerText
  });

  try{
    console.log(bodyText);
    const parsedBody =  JSON.parse(bodyText);

    if(!Array.isArray(parsedBody)) {
      throw "Failed to parse dates, probably because you are not logged in";
    }

    const dates =parsedBody.map(item => parseISO(item.date));
    const [earliest] = dates.sort(compareAsc)

    return earliest;
  }catch(err){
    console.log("Unable to parse page JSON content", originalPageContent);
    console.error(err)
    isLoggedIn = false;
  }
}


const process = async (browser) => {
  logStep(`starting process with ${maxTries} tries left`);

  if(maxTries-- <= 0){
    console.log('Reached Max tries')
    return
  }

  const page = await browser.newPage();

  if(!isLoggedIn) {
     isLoggedIn = await login(page);
  }

  for (const locId of siteInfo.FACILITY_IDS) {
    const earliestDate = await checkForSchedules(page, appointmentURL(locId));
    if(earliestDate && isBefore(earliestDate, parseISO(NOTIFY_ON_DATE_BEFORE))){
      await notifyMe(earliestDate, locId);
    }
    await delay(NEXT_SCHEDULE_POLL)
  }

  await process(browser)
}

const main = async () => {
  let browser = await puppeteer.launch(!IS_PROD ? {headless: false}: undefined);

  try{
    await process(browser);
  }catch(err){
    console.error(err);
    isLoggedIn = false;
  }
  await browser.close();
};

// call main from a try catch block and while loop
(async () => {
  while (maxTries > 0) {
    try {
      await main();
    } catch (error) {
      console.log(error);
      await delay(2*NEXT_SCHEDULE_POLL);
    }
  }
  console.log("Shutting down. Time: ", new Date().toISOString());
})();


