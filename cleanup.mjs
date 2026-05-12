// cleanup.mjs — Elimina código muerto del proyecto FinancIA
// Ejecutar desde la raíz: node cleanup.mjs

import { unlinkSync, existsSync } from 'fs';

const DEAD_FILES = [
  // API key expuesta al browser — reemplazado por /api/chat/route.ts
  'src/lib/gemini.ts',
  // getDolarBlue() — reemplazado por /api/cotizaciones/route.ts
  'src/lib/api.ts',
  // Archivos temporales de fixes anteriores (si existen)
  'patch.mjs',
  'aplicar_fixes.ps1',
  'fix_1_api_chat_route.ts',
  'fix_2_ia_page.tsx',
];

let removed = 0;
let skipped = 0;

for (const file of DEAD_FILES) {
  if (existsSync(file)) {
    unlinkSync(file);
    console.log(`🗑️  Eliminado: ${file}`);
    removed++;
  } else {
    console.log(`⏭️  No existe (ya limpio): ${file}`);
    skipped++;
  }
}

console.log(`\n✅ Limpieza completa — ${removed} eliminados, ${skipped} ya limpios`);
console.log('\nPróximo paso:');
console.log('  git add -A');
console.log('  git commit -m "chore: remove dead code and add README"');
console.log('  git push');
