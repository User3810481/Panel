import { API_URL } from './constants.js';
import { showError, showSuccess, clearMessage } from './utils.js';

let currentUser = {}; // Store username/password here, passed from auth.js

export function renderCommandCenter(username, password) {
  currentUser = { username, password };
  const container = document.getElementById('api-func-container');
  container.innerHTML = `
    <div class="command-toolbar">
      <button id="btn-kill-process" class="active">💀 終止進程</button>
      <button id="btn-shutdown">🔌 關閉電腦</button>
      <button id="btn-move-mouse">🖱️ 移動滑鼠</button>
      <button id="btn-type-keyboard">⌨️ 模擬鍵盤</button>
      <button id="btn-open-file">📂 開啟檔案</button>
      <button id="btn-run-cmd">命令行 (CMD)</button>
      <button id="btn-run-powershell">PowerShell</button>
    </div>
    <div id="command-output" class="command-output"></div>
    <div id="command-form-area"></div>
  `;

  document.getElementById('btn-kill-process').onclick = () => showCommandForm('kill-process');
  document.getElementById('btn-shutdown').onclick = () => showCommandForm('shutdown');
  document.getElementById('btn-move-mouse').onclick = () => showCommandForm('move-mouse');
  document.getElementById('btn-type-keyboard').onclick = () => showCommandForm('type-keyboard');
  document.getElementById('btn-open-file').onclick = () => showCommandForm('open-file');
  document.getElementById('btn-run-cmd').onclick = () => showCommandForm('run-cmd');
  document.getElementById('btn-run-powershell').onclick = () => showCommandForm('run-powershell');

  // Default view
  showCommandForm('kill-process');
}

function showCommandForm(commandType) {
  const formArea = document.getElementById('command-form-area');
  const outputArea = document.getElementById('command-output');
  clearMessage('command-output');
  // Clear any existing success/error message in the form area itself
  const formMessageDiv = formArea.querySelector('.error, .success');
  if (formMessageDiv) formMessageDiv.remove();

  // Update active button
  document.querySelectorAll('.command-toolbar button').forEach(btn => {
    btn.classList.remove('active');
  });
  document.getElementById(`btn-${commandType.replace(/_/g, '-')}`).classList.add('active');

  let formHtml = '';
  switch (commandType) {
    case 'kill-process':
      formHtml = `
        <form id="kill-process-form">
          <label>進程名稱
            <input type="text" id="process-name" placeholder="例如: notepad" required />
          </label>
          <div class="form-actions">
            <button type="submit">執行終止進程</button>
          </div>
        </form>
      `;
      formArea.innerHTML = formHtml;
      document.getElementById('kill-process-form').onsubmit = (e) => handleKillProcess(e, currentUser.username, currentUser.password);
      break;
    case 'shutdown':
      formHtml = `
        <form id="shutdown-form">
          <p>確定要關閉遠端電腦嗎？</p>
          <div class="form-actions">
            <button type="submit" class="btn-cancel">確認關閉</button>
          </div>
        </form>
      `;
      formArea.innerHTML = formHtml;
      document.getElementById('shutdown-form').onsubmit = (e) => handleShutdown(e, currentUser.username, currentUser.password);
      break;
    case 'move-mouse':
      formHtml = `
        <form id="move-mouse-form">
          <label>X 座標
            <input type="number" id="mouse-x" value="100" required />
          </label>
          <label>Y 座標
            <input type="number" id="mouse-y" value="100" required />
          </label>
          <div class="form-actions">
            <button type="submit">移動滑鼠</button>
          </div>
        </form>
      `;
      formArea.innerHTML = formHtml;
      document.getElementById('move-mouse-form').onsubmit = (e) => handleMoveMouse(e, currentUser.username, currentUser.password);
      break;
    case 'type-keyboard':
      formHtml = `
        <form id="type-keyboard-form">
          <label>輸入文字
            <textarea id="keyboard-text" placeholder="輸入要模擬鍵盤輸入的文字" required></textarea>
          </label>
          <div class="form-actions">
            <button type="submit">模擬鍵盤輸入</button>
          </div>
        </form>
      `;
      formArea.innerHTML = formHtml;
      document.getElementById('type-keyboard-form').onsubmit = (e) => handleTypeKeyboard(e, currentUser.username, currentUser.password);
      break;
    case 'open-file':
      formHtml = `
        <form id="open-file-form">
          <label>檔案路徑
            <input type="text" id="file-path" placeholder="例如: C:\\Documents\\report.pdf" required />
          </label>
          <div class="form-actions">
            <button type="submit">開啟檔案</button>
          </div>
        </form>
      `;
      formArea.innerHTML = formHtml;
      document.getElementById('open-file-form').onsubmit = (e) => handleOpenFile(e, currentUser.username, currentUser.password);
      break;
    case 'run-cmd':
      formHtml = `
        <form id="run-cmd-form">
          <label>CMD 命令
            <input type="text" id="cmd-command" placeholder="例如: dir C:\\" required />
          </label>
          <div class="form-actions">
            <button type="submit">執行 CMD</button>
          </div>
        </form>
      `;
      formArea.innerHTML = formHtml;
      document.getElementById('run-cmd-form').onsubmit = (e) => handleRunCmd(e, currentUser.username, currentUser.password);
      break;
    case 'run-powershell':
      formHtml = `
        <form id="run-powershell-form">
          <label>PowerShell 命令
            <input type="text" id="powershell-command" placeholder="例如: Get-Process" required />
          </label>
          <div class="form-actions">
            <button type="submit">執行 PowerShell</button>
          </div>
        </form>
      `;
      formArea.innerHTML = formHtml;
      document.getElementById('run-powershell-form').onsubmit = (e) => handleRunPowershell(e, currentUser.username, currentUser.password);
      break;
  }
}

async function sendCommand(endpoint, body, successMsg, errorMsgPrefix) {
  const outputArea = document.getElementById('command-output');
  clearMessage('command-output');
  showSuccess("執行中...", 'command-output');
  try {
    const res = await fetch(API_URL + endpoint, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ ...body, username: currentUser.username, password: currentUser.password })
    });
    const data = await res.json();
    if (data.success) {
      showSuccess(successMsg, 'command-output');
      if (data.output) {
        outputArea.innerHTML += `<div class="command-result"><pre>${data.output.replace(/</g, "&lt;")}</pre></div>`;
      }
    } else {
      showError(`${errorMsgPrefix}：${data.error || data.message || '未知錯誤'}`, 'command-output');
      if (data.output || data.error) { // Show any output or error info
        outputArea.innerHTML += `<div class="command-result error-output"><pre>${(data.output || data.error || "").replace(/</g, "&lt;")}</pre></div>`;
      }
    }
  } catch (e) {
    showError(`無法連線至API：${e.message}`, 'command-output');
  }
}

async function handleKillProcess(e, username, password) {
  e.preventDefault();
  const processName = document.getElementById('process-name').value.trim();
  await sendCommand('command/killprocess', { processName }, '進程終止成功！', '終止進程失敗');
}

async function handleShutdown(e, username, password) {
  e.preventDefault();
  if (!confirm('確認要關閉遠端電腦嗎？這將導致連線中斷。')) return;
  await sendCommand('command/shutdown', {}, '電腦關閉指令已發送！', '關閉電腦失敗');
}

async function handleMoveMouse(e, username, password) {
  e.preventDefault();
  const x = parseInt(document.getElementById('mouse-x').value);
  const y = parseInt(document.getElementById('mouse-y').value);
  if (isNaN(x) || isNaN(y)) {
    showError('X 和 Y 座標必須是數字', 'command-output');
    return;
  }
  await sendCommand('command/movemouse', { x, y }, `滑鼠已移動至 (${x}, ${y})`, '移動滑鼠失敗');
}

async function handleTypeKeyboard(e, username, password) {
  e.preventDefault();
  const text = document.getElementById('keyboard-text').value;
  await sendCommand('command/typekeyboard', { text }, '鍵盤輸入已模擬！', '模擬鍵盤輸入失敗');
}

async function handleOpenFile(e, username, password) {
  e.preventDefault();
  const path = document.getElementById('file-path').value.trim();
  await sendCommand('command/openfile', { path: path.replace(/\\/g,"\\\\") }, '檔案已開啟！', '開啟檔案失敗');
}

async function handleRunCmd(e, username, password) {
  e.preventDefault();
  const command = document.getElementById('cmd-command').value.trim();
  await sendCommand('cmd/run', { command }, 'CMD 命令執行成功！', 'CMD 命令執行失敗');
}

async function handleRunPowershell(e, username, password) {
  e.preventDefault();
  const command = document.getElementById('powershell-command').value.trim();
  await sendCommand('powershell/run', { command }, 'PowerShell 命令執行成功！', 'PowerShell 命令執行失敗');
}