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
  const currentUser = identity.rows[0].current_user;

  if (currentUser !== expectedRole) {
    throw new Error(`Unexpected current_user: ${currentUser}`);
  }

  console.log(JSON.stringify({
    database: identity.rows[0].current_database,
    current_user: currentUser,
    case_count: count.rows[0].case_count
  }));
} finally {
  await client.end();
}
