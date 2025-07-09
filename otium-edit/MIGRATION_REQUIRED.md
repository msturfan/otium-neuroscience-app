# Database Migration Required

A new `token` field has been added to the Note model in the Prisma schema. To apply this change to your database, please run:

```bash
npx prisma migrate dev --name add_note_token
```

This will:

1. Create a new migration file
2. Add the `token` column to the Note table with a unique constraint
3. Generate a UUID for existing notes (if any)

Make sure your DATABASE_URL environment variable is set before running this command.

After running the migration, you can delete this file.
