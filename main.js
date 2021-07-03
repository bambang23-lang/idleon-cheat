const spawn = require('child_process').spawn;
const CDP = require('chrome-remote-interface');
const fs = require('fs').promises;
const atob = require('atob');
const btoa = require('btoa');
const beautify = require('js-beautify');
const prompt = require('prompt');
const path = require('path');

console.log('Version 1.1.1');

const port = 32123;
let cheatInjected = false;

function attach(name) {
  return new Promise((resolve, reject) => {
    const extractionWsRegex = /^DevTools listening on (ws:\/\/.*$)/;

    const idleon = spawn(name, [`--remote-debugging-port=${port}`]);

    idleon.stderr.on('data', (data) => {
      let string = data;
      if (data instanceof Buffer) {
        string = data.toString('utf8');
      }
      const match = string.trim().match(extractionWsRegex);
      if (match) {
        console.log(`Attached to ${name}`)
        resolve(match[1]);
      }
    });
  });
}

async function setupIntercept(hook) {
  const options = {
    tab: hook,
    port: port
  };

  const client = await CDP(options);

  const { Network, Runtime } = client;
  console.log('Injecting cheats...');

  const cheats = await fs.readFile('cheats.js', 'utf8');

  const cheatsScript = `
  window.executeCheat = function(action) {
    const context = window.document.querySelector('iframe').contentWindow.__idleon_cheats__;
    return cheat.call(context, action);
  };

  ${cheats}

  console.log('Loaded cheats!');
  `;

  await Runtime.enable();
  await Runtime.evaluate({ expression: cheatsScript });

  console.log('Step 1 complete...');

  await Network.setRequestInterception(
    {
      patterns: [
        {
          urlPattern: '*Z.js',
          resourceType: 'Script',
          interceptionStage: 'HeadersReceived',
        }
      ]
    }
  );

  Network.requestIntercepted(async ({ interceptionId, request }) => {
    const response = await Network.getResponseBodyForInterception({ interceptionId });
    const originalBody = atob(response.body);
    // replace some code
    const newBody = originalBody.replace(/\w+\.ApplicationMain=/, (m) => `window.__idleon_cheats__=u;${m}`);
    console.log('Step 2 complete...');
    const newHeaders = [
      `Date: ${(new Date()).toUTCString()}`,
      `Connection: closed`,
      `Content-Length: ${newBody.length}`,
      `Content-Type: text/javascript`,
    ];
    const newResponse = btoa(
      "HTTP/1.1 200 OK\r\n" +
      newHeaders.join('\r\n') +
      "\r\n\r\n" +
      newBody
    );

    Network.continueInterceptedRequest({
      interceptionId,
      rawResponse: newResponse,
    });
    console.log('Step 3 complete...');
    console.log('Cheat injected!');
    cheatInjected = true;
  });
  return client;
}

(async function () {

  const hook = await attach('LegendsOfIdleon.exe');
  const client = await setupIntercept(hook);

  const handle = setInterval(async () => {
    if (cheatInjected) {
      clearInterval(handle);
      prompt.start();

      let action;
      while (action !== 'exit') {
        let { Action } = await prompt.get(['Action']);
        const { Runtime } = client;
        const { result } = await Runtime.evaluate({ expression: `executeCheat('${Action}')` });
        console.log(result.value);
      }
    }
  }, 500);
})();