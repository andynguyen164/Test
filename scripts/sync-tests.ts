import * as fs from 'fs';
import * as path from 'path';
import { readAllTestCases, MODULE_SHEETS } from '../utils/excel';

function main() {
  const all = readAllTestCases();
  const byModule: Record<string, number> = {};
  for (const tc of all) byModule[tc.module] = (byModule[tc.module] ?? 0) + 1;

  const out = path.join(process.cwd(), 'data', 'testcases.json');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(
    out,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        totals: { all: all.length, byModule },
        modules: MODULE_SHEETS,
        cases: all,
      },
      null,
      2,
    ),
  );
  console.log(`Wrote ${all.length} test cases to ${out}`);
  for (const m of MODULE_SHEETS) {
    console.log(`  ${m}: ${byModule[m] ?? 0}`);
  }
}

main();
