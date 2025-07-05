export function showError(msg, messageContainerId = 'login-message') {
  const div = document.getElementById(messageContainerId);
  if (div) {
    div.innerHTML = `<p class="error">${msg}</p>`;
  }
}

export function showSuccess(msg, messageContainerId = 'login-message') {
  const div = document.getElementById(messageContainerId);
  if (div) {
    div.innerHTML = `<p class="success">${msg}</p>`;
  }
}

export function clearMessage(messageContainerId = 'login-message') {
  const div = document.getElementById(messageContainerId);
  if (div) {
    div.innerHTML = "";
  }
}

export function createBreadcrumb(path) {
  const parts = path.split('\\').filter(p => p);
  let breadcrumb = '<div class="path-breadcrumb">';
  let currentPath = '';
  
  parts.forEach((part, index) => {
    currentPath += part + '\\'; 
    breadcrumb += `<span class="breadcrumb-item" data-path="${currentPath}">${part}</span>`;
    if (index < parts.length - 1) {
      breadcrumb += '<span class="breadcrumb-separator">›</span>';
    }
  });
  
  breadcrumb += '</div>';
  return breadcrumb;
}

export function getFileIcon(fileName, isFolder) {
  if (isFolder) return '📁';
  
  const ext = fileName.split('.').pop().toLowerCase();
  const iconMap = {
    'txt': '📄',
    'doc': '📘',
    'docx': '📘',
    'pdf': '📕',
    'xls': '📊',
    'xlsx': '📊',
    'ppt': '📊',
    'pptx': '📊',
    'jpg': '🖼️',
    'jpeg': '🖼️',
    'png': '🖼️',
    'gif': '🖼️',
    'bmp': '🖼️',
    'mp3': '🎵',
    'wav': '🎵',
    'mp4': '🎬',
    'avi': '🎬',
    'mov': '🎬',
    'zip': '📦',
    'rar': '📦',
    '7z': '📦',
    'exe': '⚙️',
    'msi': '⚙️',
    'html': '🌐',
    'htm': '🌐',
    'css': '🎨',
    'js': '📜',
    'json': '📜',
    'xml': '📜',
    'csv': '📊'
  };
  
  return iconMap[ext] || '📄';
}

export function formatFileSize(bytes) {
  if (bytes === undefined || bytes === null) return '—';
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}