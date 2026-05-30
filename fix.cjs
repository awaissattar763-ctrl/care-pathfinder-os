const fs = require('fs');
let code = fs.readFileSync('src/routes/patients.$patientId.tsx', 'utf8');

// Fix duplicate imports
code = code.replace(/import \{ User2, AlertTriangle, Pill \} from "lucide-react";\n/, '');

// Completely remove the demo data
const startMarker = '// ----------------------------- Demo data -----------------------------';
const endMarker = '// ----------------------------- Subcomponents -----------------------------';
const firstStart = code.indexOf(startMarker);
const endIdx = code.indexOf(endMarker);

if (firstStart !== -1 && endIdx !== -1 && firstStart < endIdx) {
  // We want to keep the firstStart but remove everything between the SECOND occurrence of startMarker and endMarker
  // Wait, let's just remove everything between firstStart and endMarker except our helper functions.
  // Actually, our helper functions are BEFORE the second startMarker.
  // Let's just find "const patient = {" and remove until "];" before Subcomponents.
  const patStart = code.indexOf('const patient = {');
  if (patStart !== -1 && patStart < endIdx) {
    code = code.substring(0, patStart) + '\n' + code.substring(endIdx);
  }
}

// Fix meds properties mapping since demo properties were used instead of real ones in JSX
code = code.replace(/m\.dose/g, 'm.sig');
code = code.replace(/m\.started/g, 'formatDate(m.created_at)');
code = code.replace(/m\.refills/g, 'm.refills');

fs.writeFileSync('src/routes/patients.$patientId.tsx', code);
console.log("Fixed!");
