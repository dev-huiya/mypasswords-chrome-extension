function call(data, callback) {
  chrome.runtime.sendMessage(data, callback);
}
const default_server_url = 'https://api-mypassword.huiya.me';

chrome.storage.local.get(['user', 'options'], function(result) {

  console.log('user, options', result);
  let options = result.options

  let serverUrlInput = document.querySelector("#serverUrl");

  if(options == null) {
    options = {
      serverUrl: default_server_url,
    };
    if(serverUrlInput != null) {
      serverUrlInput.placeholder = options.serverUrl
    }
  } else {
    if(serverUrlInput != null) {
      serverUrlInput.value = options.serverUrl
    }
  }

  if(result.user == null && location.href.indexOf('login') <= -1) {
    location.href = 'login.html'
  }
});

document.querySelectorAll("#login")[0]?.addEventListener('click', () => {
  console.log('login clicked')
  call({
    cmd: 'login',
    data: {
      email: document.querySelector('input#email').value,
      password: document.querySelector('input#password').value,
      autoLogin: true,
    }
  }, (res) => {
    console.log(res);
    if(res.success) {
      chrome.storage.local.set({user: res.resultData}, function() {
        console.log('user is set to ' + JSON.stringify(res));
      });
      location.href = 'index.html';
    } else {
      alert('로그인에 실패했습니다.')
    }
  })
});

document.querySelectorAll("#logout")[0]?.addEventListener('click', logout)

document.querySelectorAll("#setOptions")[0]?.addEventListener('click', () => {
  const _options = {
    serverUrl: document.querySelector("#serverUrl").value || default_server_url,
  }

  chrome.storage.local.set({options: _options}, function() {
    console.log('options is set to ' + _options);
  });
})

function logout() {
  localStorage.clear();
  call({cmd: 'logout'}, () => {
    location.href = 'index.html';
  })
}

function sendUser() {
  if(user == null) {
    return false;
  }

  call({
    cmd: 'sendUser',
    user,
  }, () => {
  })
  return true;
}
