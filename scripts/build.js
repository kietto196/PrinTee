'use strict';
/** Tạo public/manifest.json. Vercel tự chạy lệnh này mỗi lần deploy. */
const fs = require('fs');
const path = require('path');
const { buildManifest } = require('./manifest');

const PUBLIC = path.join(__dirname, '..', 'public');

try {
  const m = buildManifest(PUBLIC);
  fs.writeFileSync(path.join(PUBLIC, 'manifest.json'), JSON.stringify(m));
  const total = m.categories.reduce((n, c) => n + c.products.length, 0);
  console.log(`✔ PrinTee: ${m.categories.length} danh mục, ${total} sản phẩm`);
  m.categories.forEach((c) => console.log(`   • ${c.name} (${c.key}.json): ${c.products.length} sản phẩm`));
  if (m.warnings.length) {
    console.log('\n⚠ Lưu ý:');
    m.warnings.forEach((w) => console.log('   - ' + w));
  }
} catch (e) {
  console.error('✖ Build lỗi: ' + e.message);
  process.exit(1);
}
