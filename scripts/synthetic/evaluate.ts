import * as assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import type { Lot, Reference } from './generate';

type Candidate = {
  id_need: string;
  classification: 'COMPATIBLE' | 'REVIEW';
  reason: string;
  checks: string[];
  remaining_quantity: number | null;
  max_separable_quantity: number | null;
};
type Result = { status: string; suggestions: Candidate[] };
type Observation = {
  reference: Reference;
  result: Result;
  milliseconds: number;
};

async function evaluateProvider(provider: 'postgres' | 'mongo', lot: Lot) {
  const base =
    process.env[
      provider === 'postgres' ? 'SYNTHETIC_POSTGRES_API' : 'SYNTHETIC_MONGO_API'
    ];
  const email = process.env.SYNTHETIC_EMAIL;
  const password = process.env.SYNTHETIC_PASSWORD;
  if (!base || !email || !password)
    throw new Error('Configure as URLs e o acesso da API de teste.');
  const url = new URL(base);
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname))
    throw new Error('Use APIs locais dedicadas na avaliação.');
  const target = (path: string) => base.replace(/\/+$/, '') + path;
  const login = (account: string, secret: string) =>
    fetch(target('/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: account, password: secret }),
    });
  const authentication = await login(email, password);
  assert.ok(authentication.ok, 'Falha no acesso à API de teste ' + provider);
  const token = (await authentication.json()).data.access_token;
  const path = (id: string) => target('/donations/' + id + '/recommendations');
  const control = lot.references[0].donation_id;
  assert.equal(
    (await fetch(path(control))).status,
    401,
    provider + ' aceita consulta sem autenticação'
  );
  const verifiedRoles: string[] = [];
  for (const role of ['ADMIN', 'MANAGER', 'VOLUNTEER']) {
    const account = process.env['SYNTHETIC_' + role + '_EMAIL'];
    if (!account) continue;
    const response = await login(account, password);
    assert.ok(response.ok, 'Falha no acesso do perfil ' + role);
    const roleToken = (await response.json()).data.access_token;
    const payload = JSON.parse(
      Buffer.from(roleToken.split('.')[1], 'base64url').toString('utf8')
    );
    assert.equal(
      payload.role,
      role,
      'A conta de teste está associada a outro perfil.'
    );
    const probe = await fetch(path(control), {
      headers: { Authorization: 'Bearer ' + roleToken },
    });
    assert.equal(probe.status, 200, 'Falha ao consultar com perfil ' + role);
    await probe.json();
    verifiedRoles.push(role);
  }
  const observations: Observation[] = [];
  for (const reference of lot.references) {
    const start = performance.now();
    const response = await fetch(path(reference.donation_id), {
      headers: { Authorization: 'Bearer ' + token },
    });
    assert.ok(
      response.ok,
      'Resposta HTTP inesperada em ' +
        provider +
        ' para ' +
        reference.donation_id
    );
    const result: Result = (await response.json()).data;
    const milliseconds = performance.now() - start;
    assert.ok(result.suggestions.length <= 5);
    observations.push({ reference, result, milliseconds });
  }
  return { observations, verifiedRoles };
}

function metrics(rows: Observation[]) {
  const elapsed = rows.map((row) => row.milliseconds).sort((a, b) => a - b);
  const suggestions = rows.flatMap((row) => row.result.suggestions);
  const judged = rows.filter((row) => row.reference.relevant.length > 0);
  const hit = judged.filter((row) =>
    row.result.suggestions.some((item) =>
      row.reference.relevant.includes(item.id_need)
    )
  );
  let relevant = 0,
    incompatible = 0,
    falselyCompatible = 0;
  for (const row of rows)
    for (const item of row.result.suggestions) {
      if (row.reference.relevant.includes(item.id_need)) relevant++;
      if (row.reference.incompatible.includes(item.id_need)) {
        incompatible++;
        if (item.classification === 'COMPATIBLE') falselyCompatible++;
      }
    }
  return {
    cases: rows.length,
    cases_with_reference_matches: judged.length,
    cases_with_hit_at_5: hit.length,
    hit_at_5: judged.length ? hit.length / judged.length : null,
    returned: suggestions.length,
    relevant_returns: relevant,
    incompatible_returns: incompatible,
    unjudged_returns: suggestions.length - relevant - incompatible,
    relevance_among_judged:
      relevant + incompatible ? relevant / (relevant + incompatible) : null,
    needs_review: suggestions.filter((item) => item.classification === 'REVIEW')
      .length,
    empty: rows.filter((row) => row.result.suggestions.length === 0).length,
    compatibility_errors: falselyCompatible,
    unexpected_statuses: rows.filter(
      (row) => row.reference.status !== row.result.status
    ).length,
    p50_ms: elapsed.length
      ? Math.round(elapsed[Math.ceil(elapsed.length * 0.5) - 1] * 100) / 100
      : null,
    p95_ms: elapsed.length
      ? Math.round(elapsed[Math.ceil(elapsed.length * 0.95) - 1] * 100) / 100
      : null,
  };
}

export async function evaluate(lot: Lot) {
  const postgres = await evaluateProvider('postgres', lot);
  const mongo = await evaluateProvider('mongo', lot);
  const groups = ['all', ...new Set(lot.references.map((c) => c.type))];
  const providers = Object.entries({ postgres, mongo }).map(
    ([provider, run]) => ({
      provider,
      verified_roles: run.verifiedRoles,
      metrics: groups.map((type) => ({
        type,
        ...metrics(
          run.observations.filter(
            (row) => type === 'all' || row.reference.type === type
          )
        ),
      })),
      observations: run.observations.map(
        ({ reference, result, milliseconds }) => ({
          donation_id: reference.donation_id,
          result,
          milliseconds,
        })
      ),
    })
  );
  const differences = postgres.observations.flatMap((row, index) =>
    JSON.stringify(row.result) ===
    JSON.stringify(mongo.observations[index].result)
      ? []
      : [row.reference.donation_id]
  );
  return {
    manifest: lot.manifest,
    review_status: 'provisional',
    differences,
    providers,
    passed:
      !differences.length &&
      providers.every(
        (provider) =>
          !provider.metrics[0].compatibility_errors &&
          !provider.metrics[0].unexpected_statuses
      ),
  };
}
