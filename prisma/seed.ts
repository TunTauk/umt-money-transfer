import "dotenv/config";

import { createAuth } from "../lib/auth-config";
import { isValidEmail, normalizeEmail } from "../lib/email";
import { requireEnv } from "../lib/env";
import { prisma } from "../lib/prisma";

async function main() {
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
    await prisma.user.update({
      where: { id: existingOwner.id },
      data: { name, role: "OWNER", active: true },
    });
    return;
  }

  const seedAuth = createAuth({ allowSignUp: true, serverActions: false });
  const result = await seedAuth.api.signUpEmail({
    body: {
      name,
      email,
      password,
    },
  });

  await prisma.user.update({
    where: { id: result.user.id },
    data: { role: "OWNER", active: true },
  });

  // Sign-up may create a session, but a seed process has no browser to own it.
  await prisma.authSession.deleteMany({
    where: { userId: result.user.id },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
