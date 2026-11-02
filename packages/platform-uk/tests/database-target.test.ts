import assert from "node:assert/strict";
import { akshDatabaseConnectionOptions } from "../lib/db/connection-options";
for (const host of ["ep-restless-dew-zas989pv.c-2.eu-west-2.aws.neon.tech", "ep-blue-salad-fixture.neon.tech"]) {
  assert.throws(() => akshDatabaseConnectionOptions(`postgresql://user:fixture@${host}/neondb`), /must not/);
}
assert.throws(() => akshDatabaseConnectionOptions("postgresql://user:fixture@care.example.test/db?sslmode=disable"), /verified TLS/);
assert.throws(() => akshDatabaseConnectionOptions("postgresql://user:fixture@%65p-restless-dew-zas989pv.c-2.eu-west-2.aws.neon.tech/db"));
const options = akshDatabaseConnectionOptions("postgresql://user:fixture@care.example.test/db?sslmode=require");
assert.equal(options.ssl?.rejectUnauthorized, true);
assert.ok(!options.connectionString.includes("sslmode="));
assert.equal(akshDatabaseConnectionOptions("postgresql://user:fixture@localhost/db").ssl, undefined);
console.log("PASS: care/research database isolation, remote TLS verification and local development configuration.");
