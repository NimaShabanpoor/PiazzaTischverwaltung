import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Piazza 106 hat genau 4 Tische. Diese Nummern/Plätze sind Startwerte –
// der Chef kann Sitzplätze/Nummer/Status später im Admin-Bereich unter
// "Tische" anpassen. Es werden nie mehr als 4 Zeilen angelegt.
const DEFAULT_TABLES = [
  { number: 1, seats: 2 },
  { number: 2, seats: 4 },
  { number: 3, seats: 4 },
  { number: 4, seats: 6 },
];

async function main() {
  for (const t of DEFAULT_TABLES) {
    await prisma.table.upsert({
      where: { number: t.number },
      update: {},
      create: t,
    });
  }

  const username = process.env.ADMIN_USERNAME ?? "admin";
  const password = process.env.ADMIN_PASSWORD ?? "piazza106";
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.adminUser.upsert({
    where: { username },
    update: { passwordHash },
    create: { username, passwordHash },
  });

  console.log(`✔ 4 Tische geprüft/angelegt.`);
  console.log(`✔ Admin-Benutzer "${username}" bereit.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
