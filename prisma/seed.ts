import "dotenv/config";

import { createAuth } from "../lib/auth-config";
import { isValidEmail, normalizeEmail } from "../lib/email";
import { requireEnv } from "../lib/env";
import { prisma } from "../lib/prisma";

async function ensureOwner() {
  const name = requireEnv("INITIAL_OWNER_NAME");
  const email = normalizeEmail(requireEnv("INITIAL_OWNER_EMAIL"));
  const password = requireEnv("INITIAL_OWNER_PASSWORD");

  if (!isValidEmail(email)) {
    throw new Error("INITIAL_OWNER_EMAIL is not a valid email address");
  }

  if (password.length < 8) {
    throw new Error("INITIAL_OWNER_PASSWORD must be at least 8 characters");
  }

  const existingOwner = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingOwner) {
    return prisma.user.update({
      where: { id: existingOwner.id },
      data: { name, role: "OWNER", active: true },
    });
  }

  const seedAuth = createAuth({ allowSignUp: true, serverActions: false });
  const result = await seedAuth.api.signUpEmail({
    body: {
      name,
      email,
      password,
    },
  });

  const owner = await prisma.user.update({
    where: { id: result.user.id },
    data: { role: "OWNER", active: true },
  });

  // Sign-up may create a session, but a seed process has no browser to own it.
  await prisma.authSession.deleteMany({
    where: { userId: result.user.id },
  });

  return owner;
}

async function ensureFinancialAccount(input: {
  code: string;
  name: string;
  providerId: string | null;
  type: "BANK" | "CASH";
  kind: "MAIN" | "CHILD";
  parentId: string | null;
}) {
  const existing = await prisma.financialAccount.findUnique({ where: { code: input.code } });
  if (existing) {
    const structurallySafe =
      existing.type === input.type &&
      existing.kind === input.kind &&
      existing.parentId === input.parentId;
    if (!structurallySafe) {
      throw new Error(`Seed account ${input.code} exists with incompatible structure`);
    }
    return prisma.financialAccount.update({
      where: { id: existing.id },
      data: {
        name: input.name,
        active: true,
        providerId: input.providerId,
        mainSlot: input.kind === "MAIN" ? input.type : null,
      },
    });
  }

  return prisma.financialAccount.create({
    data: {
      ...input,
      active: true,
      mainSlot: input.kind === "MAIN" ? input.type : null,
    },
  });
}

async function seedFinance(ownerId: string) {
  const provider = await prisma.provider.upsert({
    where: { code: "DEMO" },
    create: { code: "DEMO", name: "Demo Money Transfer", active: true },
    update: { name: "Demo Money Transfer", active: true },
  });

  const bankMain = await ensureFinancialAccount({
    code: "DEMO-BANK-MAIN",
    name: "Main Bank",
    providerId: null,
    type: "BANK",
    kind: "MAIN",
    parentId: null,
  });
  const cashMain = await ensureFinancialAccount({
    code: "DEMO-CASH-MAIN",
    name: "Main Cash",
    providerId: null,
    type: "CASH",
    kind: "MAIN",
    parentId: null,
  });
  const bankChildren = [];
  const cashChildren = [];
  for (let number = 1; number <= 4; number += 1) {
    bankChildren.push(await ensureFinancialAccount({
      code: `DEMO-BANK-${number}`,
      name: `Bank ${number}`,
      providerId: provider.id,
      type: "BANK",
      kind: "CHILD",
      parentId: bankMain.id,
    }));
    cashChildren.push(await ensureFinancialAccount({
      code: `DEMO-CASH-${number}`,
      name: `Cash ${number}`,
      providerId: null,
      type: "CASH",
      kind: "CHILD",
      parentId: cashMain.id,
    }));
  }

  const tellers = await prisma.user.findMany({ where: { role: "TELLER", active: true } });
  for (const teller of tellers) {
    const existing = await prisma.staffAccountAssignment.findMany({
      where: { userId: teller.id },
      include: { financialAccount: { include: { parent: true } } },
    });
    for (const assignment of existing) {
      const account = assignment.financialAccount;
      const parent = account.parent;
      if (
        !account.active ||
        account.kind !== "CHILD" ||
        account.type !== assignment.accountType ||
        !parent?.active ||
        parent.kind !== "MAIN" ||
        parent.type !== account.type ||
        parent.parentId !== null ||
        parent.providerId !== null ||
        parent.mainSlot !== account.type
      ) {
        throw new Error(`Teller ${teller.email} has an invalid ${assignment.accountType} assignment`);
      }
    }

    for (const [accountType, candidates] of [["BANK", bankChildren], ["CASH", cashChildren]] as const) {
      if (existing.some((assignment) => assignment.accountType === accountType)) continue;
      let available: (typeof candidates)[number] | undefined;
      for (const candidate of candidates) {
        const count = await prisma.staffAccountAssignment.count({
          where: { financialAccountId: candidate.id },
        });
        if (count < 2) {
          available = candidate;
          break;
        }
      }
      if (!available) continue;
      await prisma.staffAccountAssignment.create({
        data: {
          userId: teller.id,
          accountType,
          financialAccountId: available.id,
          createdById: ownerId,
        },
      });
    }
  }
}

async function main() {
  const owner = await ensureOwner();
  await seedFinance(owner.id);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
