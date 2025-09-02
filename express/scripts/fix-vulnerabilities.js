const fs = require('fs');
const path = require('path');

// Lokasi file yang perlu diperbaiki
const findTargetFiles = () => {
  console.log('Mencari file tar-fs...');
  let tarFsFound = false;
  let wsFound = false;

  // Cek apakah whatsapp-web.js terinstall
  const whatsappPath = path.join(__dirname, '../node_modules/whatsapp-web.js');
  if (!fs.existsSync(whatsappPath)) {
    console.log('whatsapp-web.js tidak ditemukan, melompati perbaikan');
    return { tarFsPath: null, wsPath: null };
  }

  // Cari file tar-fs
  const tarFsPath = path.join(whatsappPath, 'node_modules/tar-fs/index.js');
  if (fs.existsSync(tarFsPath)) {
    console.log('tar-fs ditemukan di: ' + tarFsPath);
    tarFsFound = true;
  } else {
    console.log('tar-fs tidak ditemukan di lokasi yang diharapkan');
  }

  // Cari file ws
  const wsPath = path.join(whatsappPath, 'node_modules/ws/lib/websocket-server.js');
  if (fs.existsSync(wsPath)) {
    console.log('ws ditemukan di: ' + wsPath);
    wsFound = true;
  } else {
    console.log('ws tidak ditemukan di lokasi yang diharapkan');
  }

  return { 
    tarFsPath: tarFsFound ? tarFsPath : null, 
    wsPath: wsFound ? wsPath : null 
  };
};

// Mulai proses perbaikan
const { tarFsPath, wsPath } = findTargetFiles();

// Perbaiki tar-fs
if (tarFsPath) {
  console.log('Memperbaiki tar-fs...');
  let content = fs.readFileSync(tarFsPath, 'utf8');
  
  // Cek apakah file sudah diperbaiki sebelumnya
  if (content.includes('// Proteksi path traversal')) {
    console.log('tar-fs sudah diperbaiki sebelumnya');
  } else {
    // Ganti fungsi strip
    const stripFunctionPattern = /var strip = function\(map, level\) {[\s\S]*?return function\(header\) {[\s\S]*?map\(header\);[\s\S]*?return header;[\s\S]*?};[\s\S]*?};/;
    const stripFunctionReplacement = `var strip = function(map, level) {
  return function(header, cb) {
    // Proteksi path traversal
    if (header.name && (header.name.indexOf('../') !== -1 || header.name.indexOf('..\\\\') !== -1)) {
      console.error('Path traversal attempt detected:', header.name);
      if (typeof cb === 'function') {
        return cb(new Error('Path traversal attack detected: ' + header.name));
      }
      // Jika tidak ada callback, lanjutkan dengan nama file yang telah diamankan
      header.name = header.name.replace(/\\.\\.\\//g, '').replace(/\\.\\.\\\\\\\/g, '');
    }
    
    // Jika symlink, pastikan targetnya tidak mencoba keluar dari direktori
    if (header.type === 'symlink' && header.linkname && (header.linkname.indexOf('../') !== -1 || header.linkname.indexOf('..\\\\') !== -1)) {
      console.error('Symlink path traversal attempt detected:', header.linkname);
      header.linkname = header.linkname.replace(/\\.\\.\\//g, '').replace(/\\.\\.\\\\\\\/g, '');
    }
    
    var i = 0;
    while (i++ < level) {
      header.name = header.name.split('/').slice(1).join('/');
    }
    map(header);
    return header;
  };
};`;

    if (stripFunctionPattern.test(content)) {
      content = content.replace(stripFunctionPattern, stripFunctionReplacement);
      fs.writeFileSync(tarFsPath, content, 'utf8');
      console.log('tar-fs berhasil diperbaiki!');
    } else {
      console.log('Tidak dapat menemukan pola yang tepat untuk perbaikan tar-fs');
    }
  }
} else {
  console.log('Melompati perbaikan tar-fs karena file tidak ditemukan');
}

// Perbaiki ws
if (wsPath) {
  console.log('Memperbaiki ws...');
  let content = fs.readFileSync(wsPath, 'utf8');
  
  // Cek apakah file sudah diperbaiki sebelumnya
  if (content.includes('// Add protection against DoS from excessive headers')) {
    console.log('ws sudah diperbaiki sebelumnya');
  } else {
    // Cari posisi untuk perbaikan
    const versionLinePattern = /const version = \+req\.headers\['sec-websocket-version'\];/;
    const versionLineMatch = content.match(versionLinePattern);
    
    if (versionLineMatch) {
      // Tentukan posisi dan tambahkan proteksi DoS
      const insertPosition = content.indexOf(versionLineMatch[0]);
      const insertContent = `
      // Add protection against DoS from excessive headers
      const headerCount = Object.keys(req.headers).length;
      const maxHeaders = 100; // Set a reasonable limit
      
      if (headerCount > maxHeaders) {
        return abortHandshake(socket, 400, 'Too many headers');
      }

      `;
      
      // Sisipkan kode di posisi yang ditemukan
      content = content.slice(0, insertPosition) + insertContent + content.slice(insertPosition);
      
      fs.writeFileSync(wsPath, content, 'utf8');
      console.log('ws berhasil diperbaiki!');
    } else {
      console.log('Tidak dapat menemukan posisi yang tepat untuk memperbaiki ws');
    }
  }
} else {
  console.log('Melompati perbaikan ws karena file tidak ditemukan');
}

console.log('Proses perbaikan selesai!');