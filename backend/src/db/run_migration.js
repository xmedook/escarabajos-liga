const { Client } = require("pg");
const fs = require("fs");
const sql = fs.readFileSync(__dirname + "/migrate_roles.sql", "utf8");
const client = new Client({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_OhNdKI1AuFR2@ep-misty-river-a4jvgj5x-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
});
client.connect()
  .then(() => client.query(sql))
  .then(() => { console.log("Migration OK"); client.end(); })
  .catch(e => { console.error(e.message); client.end(); process.exit(1); });
