console.log("page script")

function call(data, callback) {
  chrome.runtime.sendMessage(data, callback);
}

const ids = ['id', 'email', 'username',]
const passwords = ['pw', 'pass', 'password', 'pwd',]

let input_username = null;
let input_password = null;
let datas = [];

document.querySelectorAll('input').forEach((input)=>{
  if(ids.indexOf(input?.id?.toLowerCase()) > -1) {
    console.log('id', input)
    input_username = input;
  } else if(passwords.indexOf(input?.id?.toLowerCase()) > -1 && input.type.toLowerCase() == 'password') {
    console.log('password', input);
    input_password = input;
  }
})

console.log(input_username)
if(input_password != null && input_password != null) {
  console.log('getPass called')

  input_username.addEventListener('focus', createPasswordTooltip);
  // input_password.addEventListener('focus', createPasswordTooltip);

  call({
    cmd: 'getPass',
    data: {
      value: location.hostname,
    }
  }, (_res) => {
    console.log(_res);
    datas = _res || [];
  })
}

function createPasswordTooltip(event) {
  let target = event.target;

  let rect = target.getBoundingClientRect();
  console.log(rect.top, rect.right, rect.bottom, rect.left);

  const div = document.createElement('div');
  div.className = 'mypassword-tooltip-container';
  div.style = `top: ${rect.top + target.offsetHeight}px; left: ${rect.left}px`;

  if(datas.length > 0) {
    datas.forEach((item)=>{
      console.log('item', item);
      const pass = document.createElement('div');
      pass.className = 'item';
      pass.textContent = item.username;
      pass.addEventListener('click', () => {
        input_username.value = item.username
        input_password.value = item.password

        div.remove();
      })

      div.appendChild(pass);
    })
  } else {
    const dataEmpty = document.createElement('div');
    dataEmpty.className = 'data-empty';
    dataEmpty.textContent = '저장된 비밀번호가 없습니다'
    div.appendChild(dataEmpty);
  }

  document.body.appendChild(div);

  console.log(div);
}
