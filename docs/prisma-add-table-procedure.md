# Procedure: Add a New Table in Prisma (pos-mariscos)

Use this when you need to add a new table (model) to the database.

---

## 1. Edit the schema

Open **`prisma/schema.prisma`** and add your model in the right section (or create a new section with a comment).

**Example — new table with no relations:**

```prisma
model Supplier {
  id        String   @id @default(uuid())
  name      String
  phone     String?
  email     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Example — new table with a relation to an existing table:**

```prisma
model Supplier {
  id        String   @id @default(uuid())
  name      String
  mealId    String?  // optional relation
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  meal Meal? @relation(fields: [mealId], references: [id])
}

// And in the related model (e.g. Meal), add the reverse relation:
// suppliers Supplier[]
```

**If you need a new enum**, add it in the enums section at the top:

```prisma
enum SupplierType {
  WHOLESALE
  RETAIL
}
```

Save the file.

---

## 2. Create and apply the migration

Run (replace `add_supplier_table` with a short description of the change):

```bash
npx prisma migrate dev --name add_supplier_table
```

This will:

- Create a new migration file under `prisma/migrations/`
- Apply it to your development database
- Regenerate the Prisma Client

If you get **drift** or errors, see the “Troubleshooting” section below.

---

## 3. Regenerate the client (if needed)

Usually step 2 already regenerates the client. If you only changed the schema and did not run `migrate dev`, run:

```bash
npx prisma generate
```

---

## 4. Use the new table in code

Import from your generated client and use the new model (e.g. in API routes or services):

```ts
import { prisma } from '@/prisma/prisma';

const suppliers = await prisma.supplier.findMany();
```

---

## Recommended commands (quick reference)

| Action | Command |
|--------|--------|
| Add/change schema and apply in dev | `npx prisma migrate dev --name <description>` |
| Apply migrations in production | `npx prisma migrate deploy` |
| Regenerate client only | `npx prisma generate` |
| Check migration status | `npx prisma migrate status` |
| Open DB GUI | `npx prisma studio` |

---

## Troubleshooting

**“Drift detected”**  
- Your database schema and migration history are out of sync.  
- If you can reset the dev DB: run `npx prisma migrate reset`.  
- If you must keep data: use `npx prisma migrate resolve --applied "<migration_name>"` to baseline (see project docs).

**“Migration failed” or “Table already exists”**  
- The DB may already have that table (e.g. from `db push` or manual changes).  
- Fix the migration SQL or the schema so it matches the DB, or reset with `npx prisma migrate reset` in dev.

**After changing schema, always run:**  
`npx prisma migrate dev --name <description>`  
so that a new migration is created and applied.
