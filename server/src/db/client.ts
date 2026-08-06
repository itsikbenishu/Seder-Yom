import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { connectionOptions } from "./connectionOptions.js";
import * as schema from "./schema/index.js";

const queryClient = postgres(connectionOptions);

export const db = drizzle(queryClient, { schema, casing: "snake_case" });
