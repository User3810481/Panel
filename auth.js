import { API_URL, setApiUrl, DEFAULT_API_HOST, DEFAULT_API_PORT } from './constants.js';
import { showError, showSuccess, clearMessage } from './utils.js';
import { renderFileExplorer } from './fileExplorer.js'; // Renamed import
import { renderCommandCenter } from './commandHandlers.js'; // New import

let currentActiveModule = 'file-explorer'; // State to track active module

export async function checkLogin(username, password) {
  try {
    const res = await fetch(API_URL + 'folder/get', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        username,
        password,
        path: "C:\\\\"
      })
    });
    const data = await res.json();
    if (data.success) {
      return { success: true };
    } else if (data.error) {
      return { success: false, error: data.error };
    } else {
      return { success: false, error: "未知的錯誤" };
    }
  } catch (e) {
    return { success: false, error: '無法連接API，請確認API伺服器是否啟動' };
  }
}

export function renderMainUI(username, password) {
  document.getElementById('main-container').innerHTML = `
    <h1>系統控制面板</h1>
    <div class="user-info">
      <span>已登入使用者：<b>${username}</b></span>
      <button id="logout-btn">登出系統</button>
    </div>
    <hr/>
    <div class="module-tabs">
      <button id="tab-file-explorer" class="active">檔案管理</button>
      <button id="tab-command-center">系統命令</button>
    </div>
    <div id="api-func-container"></div>
  `;
  document.getElementById('logout-btn').onclick = () => location.reload();

  const fileExplorerTab = document.getElementById('tab-file-explorer');
  const commandCenterTab = document.getElementById('tab-command-center');

  fileExplorerTab.onclick = () => {
    if (currentActiveModule !== 'file-explorer') {
      currentActiveModule = 'file-explorer';
      fileExplorerTab.classList.add('active');
      commandCenterTab.classList.remove('active');
      renderFileExplorer(username, password);
    }
  };

  commandCenterTab.onclick = () => {
    if (currentActiveModule !== 'command-center') {
      currentActiveModule = 'command-center';
      commandCenterTab.classList.add('active');
      fileExplorerTab.classList.remove('active');
      renderCommandCenter(username, password);
    }
  };

  // Render default module
  renderFileExplorer(username, password);
}

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const apiIpInput = document.getElementById('api-ip');
    const apiPortInput = document.getElementById('api-port');
    const toggleMoreOptionsBtn = document.getElementById('toggle-more-options');
    const moreOptionsDiv = document.getElementById('more-options');

    // Load saved credentials and API settings
    const savedUsername = localStorage.getItem('username');
    const savedPassword = localStorage.getItem('password'); // Warning: Storing plain passwords in localStorage is not secure for production apps.
    let savedIp = localStorage.getItem('apiIp');
    let savedPort = localStorage.getItem('apiPort');

    if (savedUsername) usernameInput.value = savedUsername;
    if (savedPassword) passwordInput.value = savedPassword;
    
    // Set default values if nothing saved, otherwise use saved values
    apiIpInput.value = savedIp || DEFAULT_API_HOST;
    apiPortInput.value = savedPort || DEFAULT_API_PORT;

    // Show more options div if saved IP/Port are not default
    if (savedIp && (savedIp !== DEFAULT_API_HOST || savedPort !== DEFAULT_API_PORT)) {
        moreOptionsDiv.classList.remove('hidden');
        toggleMoreOptionsBtn.textContent = '更多選項 ▲';
    }

    // Initialize API_URL with loaded or default values
    setApiUrl(apiIpInput.value, apiPortInput.value);

    // Toggle more options visibility
    toggleMoreOptionsBtn.addEventListener('click', () => {
      moreOptionsDiv.classList.toggle('hidden');
      if (moreOptionsDiv.classList.contains('hidden')) {
        toggleMoreOptionsBtn.textContent = '更多選項 ▼';
      } else {
        toggleMoreOptionsBtn.textContent = '更多選項 ▲';
      }
    });

    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      clearMessage();
      const username = usernameInput.value.trim();
      const password = passwordInput.value;
      const ip = apiIpInput.value.trim();
      const port = apiPortInput.value.trim();

      // Store current values
      localStorage.setItem('username', username);
      localStorage.setItem('password', password);
      localStorage.setItem('apiIp', ip);
      localStorage.setItem('apiPort', port);

      // Update API_URL for current session
      setApiUrl(ip, port);

      const btn = document.getElementById('login-btn');
      btn.disabled = true;
      showSuccess("檢查登入中...");
      
      const result = await checkLogin(username, password); 
      
      btn.disabled = false;
      if (result.success) {
        showSuccess("登入成功！");
        setTimeout(() => {
          renderMainUI(username, password);
        }, 777);
      } else {
        showError("登入失敗：" + (result.error || "請檢查帳號密碼"));
      }
    });
  }
});