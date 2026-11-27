import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { parseArgs } from 'node:util';
import { evaluate } from './evaluate';
import { digest, generate, type Lot } from './generate';
import { storage, validate } from './storage';
import { provisionOperators } from './operators';

async function main() {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      file: { type: 'string' },
      batch: { type: 'string' },
      seed: { type: 'string' },
      cutoff: { type: 'string' },
      profile: { type: 'string' },
      provider: { type: 'string' },
      report: { type: 'string' },
    },
  });
  const [action, ...extra] = positionals;
  if (action === 'operators' && !extra.length) {
    const { provider } = values;
    if (provider !== 'postgres' && provider !== 'mongo')
      throw new Error('Informe --provider postgres ou mongo.');
    console.log(JSON.stringify(await provisionOperators(provider), null, 2));
    return;
  }
  if (
    extra.length ||
    !values.file ||
    !['generate', 'load', 'verify', 'evaluate'].includes(action)
  )
    throw new Error(
      'Use generate, load, verify ou evaluate com --file <caminho>.'
    );

  if (action === 'generate') {
    const { batch, cutoff, profile } = values;
    const seed = Number(values.seed);
    if (
      !batch ||
      !/^[a-z0-9_-]+$/.test(batch) ||
      !values.seed?.trim() ||
      !Number.isSafeInteger(seed) ||
      seed < 0 ||
      !cutoff ||
      !Number.isFinite(Date.parse(cutoff)) ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(cutoff) ||
      (profile !== 'small' && profile !== 'full')
    )
      throw new Error(
        'Informe --batch, --seed inteira, --cutoff em UTC ISO e --profile small ou full.'
      );
    const lot = generate({
      batch,
      seed,
      cutoff: new Date(cutoff).toISOString(),
      profile,
    });
    validate(lot, lot.rows);
    await mkdir(dirname(values.file), { recursive: true });
    try {
      await writeFile(values.file, JSON.stringify(lot), { flag: 'wx' });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      const existing = await readFile(values.file, 'utf8');
      if (existing !== JSON.stringify(lot))
        throw new Error('O arquivo já contém outro lote.');
    }
    console.log(JSON.stringify(lot.manifest, null, 2));
    return;
  }

  const lot = JSON.parse(await readFile(values.file, 'utf8')) as Lot;
  if (
    digest({
      rows: lot.rows,
      restocked: lot.restocked,
      references: lot.references,
    }) !== lot.manifest.signature
  )
    throw new Error('A assinatura do lote diverge do manifesto.');
  validate(lot, lot.rows);
  if (action === 'evaluate') {
    if (!values.report) throw new Error('Informe --report <arquivo JSON>.');
    const report = await evaluate(lot);
    await mkdir(dirname(values.report), { recursive: true });
    await writeFile(values.report, JSON.stringify(report, null, 2) + '\n');
    console.log(
      JSON.stringify(
        {
          passed: report.passed,
          differences: report.differences,
          providers: report.providers.map(
            ({ observations, ...provider }) => provider
          ),
        },
        null,
        2
      )
    );
    if (!report.passed) process.exitCode = 1;
    return;
  }

  const { provider } = values;
  if (provider !== 'postgres' && provider !== 'mongo')
    throw new Error('Informe --provider postgres ou mongo.');
  console.log(
    JSON.stringify(await storage(provider, lot, action === 'load'), null, 2)
  );
}

main().catch((error) => {
  // As URLs de conexão podem carregar credenciais.
  console.error(
    String(error.message ?? error).replace(
      /(?:postgres(?:ql)?|mongodb(?:\+srv)?):\/\/[^\s\x22]+/gi,
      '[conexão omitida]'
    )
  );
  process.exitCode = 1;
});
