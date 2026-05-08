import * as fs from 'fs';

interface Result {
  id: string;
  status: string;
  flaky?: boolean;
  module?: string;
}
interface RunFile {
  runId: string;
  results: Result[];
}

function load(p: string): RunFile {
  const raw = fs.readFileSync(p, 'utf8');
  return JSON.parse(raw);
}

function main() {
  const [a, b] = process.argv.slice(2);
  if (!a || !b) {
    console.error('Usage: ts-node scripts/compare-runs.ts <runA/report.json> <runB/report.json>');
    process.exit(1);
  }
  const A = load(a);
  const B = load(b);

  const mapA = new Map<string, Result>();
  for (const r of A.results) mapA.set(r.id, r);
  const mapB = new Map<string, Result>();
  for (const r of B.results) mapB.set(r.id, r);

  const ids = new Set<string>([...mapA.keys(), ...mapB.keys()]);
  const changes: Array<{ id: string; from: string; to: string }> = [];
  const newOnly: string[] = [];
  const droppedOnly: string[] = [];

  for (const id of ids) {
    const ra = mapA.get(id);
    const rb = mapB.get(id);
    if (ra && !rb) droppedOnly.push(id);
    else if (!ra && rb) newOnly.push(id);
    else if (ra && rb && ra.status !== rb.status) {
      changes.push({ id, from: ra.status, to: rb.status });
    }
  }

  console.log(`Comparing ${A.runId} -> ${B.runId}`);
  console.log(`\nStatus changes (${changes.length}):`);
  for (const c of changes) console.log(`  ${c.id}: ${c.from} -> ${c.to}`);
  if (newOnly.length) {
    console.log(`\nNew in ${B.runId} (${newOnly.length}):`);
    for (const id of newOnly) console.log(`  ${id}`);
  }
  if (droppedOnly.length) {
    console.log(`\nMissing from ${B.runId} (${droppedOnly.length}):`);
    for (const id of droppedOnly) console.log(`  ${id}`);
  }
}

main();
