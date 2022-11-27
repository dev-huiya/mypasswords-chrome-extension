importScripts('lib/crypto-js.js')

// default values
const default_server_url = 'https://api-mypassword.huiya.me';
let server_url = '';
let user = null;

// Encrypt.ts
const iv = '0000000000000000'
// https://github.com/brix/crypto-js/issues/334
const decrypt = (encryptedText, sharedKey) => {
  const bytes = CryptoJS.AES.decrypt(
    encryptedText,
    CryptoJS.enc.Utf8.parse(sharedKey),
    {
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
      iv: CryptoJS.enc.Utf8.parse(iv),
    }
  )
  const decryptedStr = CryptoJS.enc.Utf8.stringify(bytes)
  return decryptedStr.toString()
}

const encrypt = (plainText, sharedKey) => {
  const encryptKey = CryptoJS.enc.Utf8.parse(sharedKey)
  const encryptedStr = CryptoJS.AES.encrypt(
    CryptoJS.enc.Utf8.parse(plainText),
    encryptKey,
    {
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
      iv: CryptoJS.enc.Utf8.parse(iv),
    }
  )

  return encryptedStr.toString()
}

function parseJwt (token) {
  var base64Url = token.split('.')[1];
  var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);
}

const getSharedKey = () => {
  const publicKey = user.publicKey
  const encryptedSharedKey = parseJwt(user.token).info.sharedKey

  console.log('publicKey', publicKey)
  console.log('encryptedSharedKey', encryptedSharedKey)

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const hash = CryptoJS.SHA256(publicKey)
  const tokenKey = hash.toString(CryptoJS.enc.Hex).substring(0, 32)

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return decrypt(encryptedSharedKey, tokenKey)
}

const clientToServer = (plainText) => {
  return encrypt(plainText, getSharedKey())
}

const serverToClient = (encryptedText) => {
  return decrypt(encryptedText, getSharedKey())
}

chrome.storage.local.get(['user'], function(result) {
  user = result.user;
});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
      "from a content script:" + sender.tab.url :
      "from the extension");

    if (request.cmd === "login") {
      query('/auth/signin', 'post', request.data)
        .then(res => {
          sendResponse(res);

          if(res.success) {
            user = res.resultData;
          }
        })
      return true
    } else if(request.cmd === "logout") {
      user = null;
      chrome.storage.local.set({user: null}, function() {
        console.log('user is set to ' + null);
      });
      sendResponse({success: true});
    } else if(request.cmd === "getPass") {
      query('/password/host', 'get', request.data)
        .then(r => {
          console.log('host', r)
          if(r.success) {
            sendResponse(r.resultData.map(item=>{
              item.username = serverToClient(item.username);
              item.password = serverToClient(item.password);
              return item;
            }));
          } else {
            sendResponse([]);
          }
        })
      return true
    } else if(request.cmd === "setOptions") {
      server_url = request.options.serverUrl;
      sendResponse({success: true});
    }
  }
);

async function query(url, method, params) {
  let query = '';
  let body = {};

  if(method == 'get') {
    query = Object.keys(params)
      .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
      .join('&');
  } else {
    body.body = JSON.stringify(params)
  }

  let header = {}
  if(user != null) {
    header = {
      'Authorization': `Bearer ${user.token}`,
    }
  }

  console.log(`${server_url}${url}${query != '' ? `?${query}` : ''}`);

  return fetch(`${server_url || default_server_url}${url}${query != '' ? `?${query}` : ''}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...header,
    },
    ...body,
  }).then((response) => response.json())
    .then(response => {
      if(response.message == "JWT_EXPIRED_ERROR") {

      }
      return response;
    });
}

function refresh() {

  query('/auth/refresh', 'post', {

  })
}
