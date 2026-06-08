import pg from "pg";

const { Client } = pg;
const expectedRole = "badcase_forge_260608_app";
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 8000
});

await client.connect();

try {
  const identity = await client.query("select current_database(), current_user");
  const count = await client.query("select count(*)::int as case_count from badcase_forge_260608.bad_cases");
  const permissions = await client.query(`
    select
      has_schema_privilege(current_user, 'badcase_forge_260608', 'USAGE') as own_schema_usage,
      has_schema_privilege(current_user, 'public', 'CREATE') as public_schema_create,
      has_database_privilege(current_user, current_database(), 'CREATE') as database_create
  `);
  const currentUser = identity.rows[0].current_user;

  if (currentUser !== expectedRole) {
    throw new Error(`Unexpected current_user: ${currentUser}`);
  }

  console.log(JSON.stringify({
    database: identity.rows[0].current_database,
    current_user: currentUser,
    case_count: count.rows[0].case_count,
    own_schema_usage: permissions.rows[0].own_schema_usage,
    public_schema_create: permissions.rows[0].public_schema_create,
    database_create: permissions.rows[0].database_create
  }));
} finally {
  await client.end();
}
