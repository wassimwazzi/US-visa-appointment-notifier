const config = require('./config');
const { WebClient } = require('@slack/web-api');
const slackToken = config.slackToken;

const siteInfo = config.siteInfo;
const timeOptions = { timeZone: 'America/New_York' };

const debug = async (page, logName, saveScreenShot) => {
  if(saveScreenShot){
    await page.screenshot({path: `${logName}.png`});
  }

  await page.evaluate(() => {
    debugger;
  });
};

const delay = (timeout) => {
  console.log(`Delaying for ${timeout/1000}s...`);
  return new Promise((resolve) => setTimeout(resolve, timeout));
};

const sendSlackMessage = async (params) => {
  console.log(slackToken);
  const web = new WebClient(slackToken);
  const channel = '#general';
  const message = {
    text: params.text,
  };
  try {
    const result = await web.chat.postMessage({
      text: message.text,
      channel: channel,
    });
    console.log(`Successfully sent message to ${channel}: ${result.message.text}`);
  } catch (error) {
    console.error(`Error sending message to ${channel}: ${error}`);
  }
};

function appointmentURL(locId) {
  return `https://ais.usvisa-info.com/${siteInfo.COUNTRY_CODE}/niv/schedule/${siteInfo.SCHEDULE_ID}/appointment/days/${locId}.json?appointments%5Bexpedite%5D=false`
}


const logStep = (stepTitle) => {
  console.log(new Date().toLocaleString('en-US', timeOptions), "=====>>> Step:", stepTitle);
}

module.exports = {
  debug,
  delay,
  sendSlackMessage,
  logStep,
  appointmentURL,
  timeOptions
}
