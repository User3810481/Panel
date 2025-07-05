import { API_URL } from './constants.js';
import { showError, showSuccess, clearMessage, createBreadcrumb, getFileIcon, formatFileSize } from './utils.js';

let currentViewMode = 'grid'; // State for file explorer view mode

export function renderFileExplorer(username, password) {
  const container = document.getElementById('api-func-container');
  container.innerHTML = `
    <form id="browse-form">
      <label>路徑
        <input type="text" id="folder-path" value="C:\\" required/>
      </label>
      <button type="submit">🔍 瀏覽</button>
    </form>
    <div id="browse-message"></div>
    <div class="toolbar">
      <button id="back-btn" class="btn-cancel">
        <span class="btn-icon">←</span>
        上一層
      </button>
      <button id="refresh-btn" class="btn-cancel">
        <span class="btn-icon">🔄</span>
        重新整理
      </button>
      <button id="new-folder-btn" class="btn-create-folder">
        <span class="btn-icon">📁</span>
        新增資料夾
      </button>
      <button id="new-file-btn" class="btn-create-file">
        <span class="btn-icon">📄</span>
        新增檔案
      </button>
    </div>
    <div id="folder-content"></div>
  `;

  document.getElementById('browse-form').onsubmit = async function(e) {
    e.preventDefault();
    await showFolderContent(username, password);
  };

  document.getElementById('back-btn').onclick = function() {
    const currentPath = document.getElementById('folder-path').value;
    // Handle root path C:\ logic. Ensure it doesn't go above C:\
    const parts = currentPath.split('\\').filter(p => p);
    if (parts.length > 1) { // If not at a drive root like C:\
      const parentPath = currentPath.substring(0, currentPath.lastIndexOf('\\', currentPath.length - 2) + 1); // Get parent path
      document.getElementById('folder-path').value = parentPath || 'C:\\'; // Default to C:\ if empty after navigating up from C:\something
      showFolderContent(username, password);
    } else if (parts.length === 1 && currentPath.endsWith('\\')) { // If at C:\
      // Do nothing, already at root
    } else if (parts.length === 1 && !currentPath.endsWith('\\')) { // If at C: (without backslash)
      document.getElementById('folder-path').value = "C:\\"; // Normalize to C:\
      showFolderContent(username, password);
    }
  };

  document.getElementById('refresh-btn').onclick = function() {
    showFolderContent(username, password);
  };

  document.getElementById('new-folder-btn').onclick = function() {
    renderCreateFolderUI(username, password, document.getElementById('folder-path').value);
  };

  document.getElementById('new-file-btn').onclick = function() {
    renderCreateFileUI(username, password, document.getElementById('folder-path').value);
  };

  showFolderContent(username, password);
}

export async function showFolderContent(username, password) {
  const pathInput = document.getElementById('folder-path');
  let folderPath = pathInput.value.trim();
  if (!folderPath) folderPath = "C:\\"; // Default to C:\ if empty
  
  // Ensure path ends with a backslash if it's a drive root (e.g., C:\)
  if (folderPath.match(/^[A-Za-z]:$/)) {
      folderPath += '\\';
      pathInput.value = folderPath; // Update the input field
  } else if (!folderPath.endsWith('\\') && folderPath.includes('\\')) {
      // If it's a subfolder like C:\Users\User and doesn't end with \, add it for consistency.
      folderPath += '\\';
      pathInput.value = folderPath;
  }

  clearMessage('browse-message'); // Clear previous messages
  showSuccess("載入中...", 'browse-message');
  
  try {
    const res = await fetch(API_URL + 'folder/get', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ username, password, path: folderPath.replace(/\\/g,"\\\\") })
    });
    const data = await res.json();
    
    if (data.success) {
      clearMessage('browse-message'); // Clear loading message
      renderFileExplorerContent(data, username, password);
    } else {
      showError(`錯誤：${data.error || '查詢失敗'}`, 'browse-message');
      document.getElementById('folder-content').innerHTML = ''; // Clear content on error
    }
  } catch (e) {
    showError(`無法連線至API: ${e.message}`, 'browse-message');
    document.getElementById('folder-content').innerHTML = '';
  }
}

function renderFileExplorerContent(data, username, password) {
  const totalItems = data.folders.length + data.files.length;
  const currentPath = document.getElementById('folder-path').value;
  
  let html = `
    <div class="file-explorer-header">
      ${createBreadcrumb(currentPath)}
      <div class="view-controls">
        <button class="view-btn ${currentViewMode === 'grid' ? 'active' : ''}" data-view="grid">
          ⊞ 大圖示
        </button>
        <button class="view-btn ${currentViewMode === 'list' ? 'active' : ''}" data-view="list">
          ☰ 詳細資料
        </button>
      </div>
    </div>
    <div class="file-items-scroll-area">`; // New wrapper for scrollable content
  
  if (currentViewMode === 'grid') {
    html += '<div class="file-grid">';
    
    if (totalItems === 0) {
      html += '<div class="empty-state" style="grid-column: 1 / -1;">此資料夾為空</div>';
    }
    
    // 資料夾
    for (const folder of data.folders) {
      html += `
        <div class="file-item" data-path="${folder.path}" data-type="folder">
          <div class="file-icon">${getFileIcon(folder.name, true)}</div>
          <div class="file-name">${folder.name}</div>
        </div>
      `;
    }
    
    // 檔案
    for (const file of data.files) {
      html += `
        <div class="file-item" data-path="${file.path}" data-type="file">
          <div class="file-icon">${getFileIcon(file.name, false)}</div>
          <div class="file-name">${file.name}</div>
        </div>
      `;
    }
    
    html += '</div>';
  } else { // List view
    html += `
      <div class="file-list">
        <table>
          <thead>
            <tr>
              <th>名稱</th>
              <th>修改日期</th>
              <th>類型</th>
              <th>大小</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    if (totalItems === 0) {
      html += '<tr><td colspan="5" class="empty-state">此資料夾為空</td></tr>';
    }
    
    // 資料夾
    for (const folder of data.folders) {
      html += `
        <tr class="file-item" data-path="${folder.path}" data-type="folder">
          <td class="file-name-cell">
            <div class="file-name">
              <span class="file-icon">${getFileIcon(folder.name, true)}</span>
              ${folder.name}
            </div>
          </td>
          <td>${folder.modified ? new Date(folder.modified).toLocaleString('zh-TW') : '—'}</td>
          <td>檔案資料夾</td>
          <td>—</td>
          <td class="file-actions-cell">
            <div class="file-actions">
              <button class="btn-delete" data-path="${folder.path}" data-type="folder">刪除</button>
            </div>
          </td>
        </tr>
      `;
    }
    
    // 檔案
    for (const file of data.files) {
      const fileSize = formatFileSize(file.size); // Use formatFileSize helper
      html += `
        <tr class="file-item" data-path="${file.path}" data-type="file">
          <td class="file-name-cell">
            <div class="file-name">
              <span class="file-icon">${getFileIcon(file.name, false)}</span>
              ${file.name}
            </div>
          </td>
          <td>${file.modified ? new Date(file.modified).toLocaleString('zh-TW') : '—'}</td>
          <td>檔案</td>
          <td>${fileSize}</td>
          <td class="file-actions-cell">
            <div class="file-actions">
              <button class="btn-view" data-path="${file.path}">檢視</button>
              <button class="btn-delete" data-path="${file.path}" data-type="file">刪除</button>
            </div>
          </td>
        </tr>
      `;
    }
    
    html += '</tbody></table></div>';
  }
  
  html += `
    </div> <!-- End of .file-items-scroll-area -->
    <div class="status-bar">
      <span>${totalItems} 個項目</span>
      <span>${data.folders.length} 個資料夾，${data.files.length} 個檔案</span>
    </div>
  `;
  
  document.getElementById('folder-content').innerHTML = html;
  
  // 綁定事件
  bindFileExplorerEvents(username, password);
}

function bindFileExplorerEvents(username, password) {
  // 視圖切換
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.onclick = function() {
      currentViewMode = this.dataset.view;
      showFolderContent(username, password);
    };
  });
  
  // 路徑導覽
  document.querySelectorAll('.breadcrumb-item').forEach(item => {
    item.onclick = function() {
      const path = this.dataset.path;
      document.getElementById('folder-path').value = path;
      showFolderContent(username, password);
    };
  });
  
  // 檔案/資料夾點擊 (single click)
  document.querySelectorAll('.file-item').forEach(item => {
    item.addEventListener('click', function(e) {
      if (e.target.tagName === 'BUTTON' || e.target.closest('.file-actions')) return; // Ignore clicks on action buttons
      
      const path = this.dataset.path;
      const type = this.dataset.type;
      
      if (type === 'folder' && currentViewMode === 'grid') { // Only navigate on single click in grid view for folders
        document.getElementById('folder-path').value = path;
        showFolderContent(username, password);
      }
    });
    
    // 雙擊檔案開啟 / 資料夾導覽
    item.addEventListener('dblclick', function(e) {
      if (e.target.tagName === 'BUTTON' || e.target.closest('.file-actions')) return;
      
      const path = this.dataset.path;
      const type = this.dataset.type;
      
      if (type === 'file') {
        viewFile(username, password, path);
      } else if (type === 'folder' && currentViewMode === 'list') { // Double click to open folder in list view
        document.getElementById('folder-path').value = path;
        showFolderContent(username, password);
      }
    });
  });
  
  // 刪除按鈕
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.onclick = async function(e) {
      e.stopPropagation();
      const path = this.dataset.path;
      const type = this.dataset.type;
      
      if (!confirm(`確定刪除此${type === 'folder' ? '資料夾' : '檔案'}？`)) return;
      
      clearMessage('browse-message');
      showSuccess(`正在刪除${type === 'folder' ? '資料夾' : '檔案'}...`, 'browse-message');

      const endpoint = type === 'folder' ? 'folder/delete' : 'file/delete';
      const res = await fetch(API_URL + endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ username, password, path: path.replace(/\\/g,"\\\\") })
      });
      const data = await res.json();
      
      if (data.success) {
        clearMessage('browse-message');
        showFolderContent(username, password); // Refresh content
      } else {
        showError(`刪除失敗：${data.error || data.message}`, 'browse-message');
      }
    };
  });
  
  // 檢視按鈕
  document.querySelectorAll('.btn-view').forEach(btn => {
    btn.onclick = function(e) {
      e.stopPropagation();
      const path = this.dataset.path;
      viewFile(username, password, path);
    };
  });
}

export async function viewFile(username, password, path) {
  clearMessage('browse-message');
  showSuccess("正在讀取檔案內容...", 'browse-message');
  
  try {
    const res = await fetch(API_URL + 'file/read', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ username, password, path: path.replace(/\\/g,"\\\\") })
    });
    const data = await res.json();
    
    if (data.success) {
      const msgDiv = document.getElementById('browse-message');
      msgDiv.innerHTML = `
        <div class="file-content">
          <div class="file-path">${data.path}</div>
          <code>${data.content.replace(/</g,"&lt;")}</code>
        </div>
        <div class="form-actions">
          <button id="edit-file-btn" data-path="${data.path}" class="btn-create-file">
            <span class="btn-icon">✏️</span>
            編輯檔案
          </button>
          <button id="close-file-btn" class="btn-cancel">
            <span class="btn-icon">✕</span>
            關閉
          </button>
        </div>
      `;
      
      document.getElementById('edit-file-btn').onclick = () => {
        renderEditFileUI(username, password, data.path, data.content);
      };
      
      document.getElementById('close-file-btn').onclick = () => {
        clearMessage('browse-message'); // Close the view/edit form
      };
    } else {
      showError(`檔案讀取失敗：${data.error || data.message}`, 'browse-message');
    }
  } catch (e) {
    showError(`無法連線至API：${e.message}`, 'browse-message');
  }
}

export function renderCreateFolderUI(username, password, parentPath) {
  const msgDiv = document.getElementById('browse-message');
  clearMessage('browse-message'); // Clear previous messages
  msgDiv.innerHTML = `
    <form id="create-folder-form">
      <label>新資料夾名稱
        <input type="text" id="new-folder-name" required placeholder="請輸入資料夾名稱" />
      </label>
      <div class="form-actions">
        <button type="submit" class="btn-create-folder">建立資料夾</button>
        <button type="button" id="cancel-create-folder" class="btn-cancel">取消</button>
      </div>
    </form>
  `;
  document.getElementById('create-folder-form').onsubmit = async function(e) {
    e.preventDefault();
    const newName = document.getElementById('new-folder-name').value.trim();
    if (!newName) return;
    const fullPath = (parentPath.endsWith('\\') ? parentPath : parentPath + '\\') + newName;
    
    showSuccess("正在建立資料夾...", 'browse-message');
    const res = await fetch(API_URL + 'folder/create', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ username, password, path: fullPath.replace(/\\/g,"\\\\") })
    });
    const d = await res.json();
    if (d.success) {
      clearMessage('browse-message');
      showFolderContent(username, password); // Refresh content
    } else {
      showError('創建失敗: ' + (d.error || d.message), 'browse-message');
    }
  };
  document.getElementById('cancel-create-folder').onclick = () => {
    clearMessage('browse-message');
  };
}

export function renderCreateFileUI(username, password, parentPath) {
  const msgDiv = document.getElementById('browse-message');
  clearMessage('browse-message'); // Clear previous messages
  msgDiv.innerHTML = `
    <form id="create-file-form">
      <label>新檔案名稱
        <input type="text" id="new-file-name" required placeholder="例如: document.txt" />
      </label>
      <div class="form-actions">
        <button type="submit" class="btn-create-file">建立檔案</button>
        <button type="button" id="cancel-create-file" class="btn-cancel">取消</button>
      </div>
    </form>
  `;
  document.getElementById('create-file-form').onsubmit = async function(e) {
    e.preventDefault();
    const newName = document.getElementById('new-file-name').value.trim();
    if (!newName) return;
    const fullPath = (parentPath.endsWith('\\') ? parentPath : parentPath + '\\') + newName;
    
    showSuccess("正在建立檔案...", 'browse-message');
    const res = await fetch(API_URL + 'file/create', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ username, password, path: fullPath.replace(/\\/g,"\\\\") })
    });
    const d = await res.json();
    if (d.success) {
      clearMessage('browse-message');
      showFolderContent(username, password); // Refresh content
    } else {
      showError('創建失敗: ' + (d.error || d.message), 'browse-message');
    }
  };
  document.getElementById('cancel-create-file').onclick = () => {
    clearMessage('browse-message');
  };
}

export function renderEditFileUI(username, password, filePath, content) {
  const msgDiv = document.getElementById('browse-message');
  clearMessage('browse-message'); // Clear previous messages
  msgDiv.innerHTML = `
    <form id="edit-file-form">
      <div class="file-path">${filePath}</div>
      <label>檔案內容
        <textarea id="file-edit-content">${content.replace(/</g, "&lt;")}</textarea>
      </label>
      <div class="form-actions">
        <button type="submit" class="btn-create-folder">儲存檔案</button>
        <button type="button" id="cancel-edit-file" class="btn-cancel">取消</button>
      </div>
    </form>
  `;
  document.getElementById('edit-file-form').onsubmit = async function(e) {
    e.preventDefault();
    const newContent = document.getElementById('file-edit-content').value;
    
    showSuccess("正在儲存檔案...", 'browse-message');
    const res = await fetch(API_URL + 'file/write', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ username, password, path: filePath.replace(/\\/g,"\\\\"), content: newContent })
    });
    const d = await res.json();
    if (d.success) {
      showSuccess('檔案儲存成功！', 'browse-message');
      setTimeout(() => { 
        clearMessage('browse-message');
        viewFile(username, password, filePath); // Re-open the file view to show updated content
      }, 777); 
    } else {
      showError('儲存失敗：' + (d.error || d.message), 'browse-message');
    }
  };
  document.getElementById('cancel-edit-file').onclick = () => {
    clearMessage('browse-message');
  };
}