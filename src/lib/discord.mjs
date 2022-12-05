import { postRequest } from './http.mjs';

export async function postToDiscord (path, messageContent) {
  console.debug(`Executing discord::postToDiscord - path: '${path}' messageContent: '${JSON.stringify(messageContent)}'`);

  // will be used if messageContent is undefined
  // const defaultBody = '{"content": "Posted Via Command line"}';
  // const body = messageContent ? JSON.stringify({ content: messageContent }) : defaultBody;

  if (!messageContent) {
    console.warn('No messageContent received. Skipping postToDiscord.');
    return;
  }

  const body = {
    content: prettifyMessage(messageContent),
    username: discordUsername()
  };

  const options = {
    hostname: 'discord.com',
    path,
    method: 'POST',
    port: 443, // 👈️ replace with 80 for HTTP requests
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  };

  try {
    const res = await postRequest(options, body);
    console.debug(`Discord response: ${JSON.stringify(res)}`);
    return res;
  } catch (err) {
    console.error('Discord threw an error!');
    console.error('Error', err.message);
    return err;
  }
}

function discordUsername () {
  const seed = Math.floor(Math.random() * 10); // random integer from 0 to 9

  // 0 to 2
  if (seed >= 0 && seed < 3) {
    return 'Keebot';
  }
  // 3 to 5
  if (seed >= 3 && seed < 6) {
    return 'Keebotron';
  }
  // 6 to 7
  if (seed >= 6 && seed < 8) {
    return 'Norbot';
  }
  // 8 to 9
  if (seed >= 8 && seed < 10) {
    return 'Thocotron';
  }
}

function prettifyMessage (message) {
  if ('title' in message &&
      'quantity' in message &&
      'site' in message) {
    return `${message.title} - ${message.quantity ? message.quantity : 'unknown qty of'} units available!!! [Link](${message.site})`;
  }
}
