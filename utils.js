const config = require('./config');
const { WebClient } = require('@slack/web-api');
const slackToken = config.slackToken;
const formData = require('form-data');

// const mailgun = new Mailgun(formData);
// const mg = mailgun.client({username: 'api', key: config.mailgun.API_KEY});

const debug = async (page, logName, saveScreenShot) => {
  if(saveScreenShot){
    await page.screenshot({path: `${logName}.png`});
  }

  await page.evaluate(() => {
    debugger;
  });
};

const delay = timeout => new Promise(resolve => setTimeout(resolve, timeout));

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

function apointmentURL(locId) {
  return `https://ais.usvisa-info.com/${siteInfo.COUNTRY_CODE}/niv/schedule/${siteInfo.SCHEDULE_ID}/appointment/days/${locId}.json?appointments%5Bexpedite%5D=false`
}


const logStep = (stepTitle) => {
  console.log("=====>>> Step:", stepTitle);
}

module.exports = {
  debug,
  delay,
  sendSlackMessage,
  logStep
}
