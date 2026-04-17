/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require("child_process");

function run(cmd) {
  console.log(`$ ${cmd}`);
  return execSync(cmd, { stdio: "pipe" }).toString("utf8");
}

function runAllowFail(cmd) {
  console.log(`$ ${cmd}`);
  try {
    const out = execSync(cmd, { stdio: "pipe" }).toString("utf8");
    return { ok: true, out };
  } catch (e) {
    const stdout = e?.stdout ? e.stdout.toString("utf8") : "";
    const stderr = e?.stderr ? e.stderr.toString("utf8") : "";
    return { ok: false, stdout, stderr };
  }
}

// Render often points at an existing (non-empty) DB created outside Prisma migrations.
// In that case, `prisma migrate deploy` fails with P3005 until we baseline the DB
// by marking the initial migration as already applied.
const BASELINE_MIGRATION = "20260404190000_init_postgres";

async function main() {
  // Always generate client first (safe + fast).
  run("npx prisma generate");

  const deploy = runAllowFail("npx prisma migrate deploy");
  if (deploy.ok) {
    console.log(deploy.out);
    return;
  }

  const combined = `${deploy.stdout}\n${deploy.stderr}`;
  if (combined.includes("P3005")) {
    console.warn("Prisma P3005 detected. Baselining existing database...");

    // Mark the initial migration as applied, then deploy remaining migrations.
    const resolve = runAllowFail(`npx prisma migrate resolve --applied ${BASELINE_MIGRATION}`);
    if (!resolve.ok) {
      console.error(resolve.stdout);
      console.error(resolve.stderr);
      throw new Error("Failed to baseline database with prisma migrate resolve.");
    }

    const deploy2 = runAllowFail("npx prisma migrate deploy");
    if (!deploy2.ok) {
      console.error(deploy2.stdout);
      console.error(deploy2.stderr);
      throw new Error("prisma migrate deploy failed after baselining.");
    }

    console.log(deploy2.out);
    return;
  }

  console.error(deploy.stdout);
  console.error(deploy.stderr);
  throw new Error("prisma migrate deploy failed.");
}

main().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});

