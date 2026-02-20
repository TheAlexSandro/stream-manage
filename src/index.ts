import dotenv from "dotenv";
dotenv.config();

import { Bot, Context } from "grammy";
import { Messages } from "./Handlers/Messages";
import { CallbackQuery } from "./Handlers/CallbackQuery";
import { Elysia } from "elysia";
import { node } from "@elysiajs/node";
import fs from "fs";

const bot = new Bot(process.env["BOT_TOKEN"]!);
const port = Number(process.env["PORT"] || 8000);

bot.on("message", (ctx: NonNullable<Context>) => {
  return Messages.handle(ctx, bot);
});

bot.on("callback_query", (ctx: NonNullable<Context>) => {
  return CallbackQuery.handle(ctx, bot);
});

// if (process.env["COOKIES_CONTENT"]) {
//   fs.writeFileSync(
//     "cookies.txt",
//     String(process.env["COOKIES_CONTENT"]).replace(/"/g, "").trim(),
//   );
//   console.log("Cookies created.");
// }

console.log(fs.readFileSync("cookies.txt", "utf8").substring(0, 30));

bot.start({
  drop_pending_updates: true,
  allowed_updates: ["message", "callback_query"],
});

new Elysia({ adapter: node() })
  .get("/", ({ status }) => {
    return status(200, { ok: true, code: 200, message: "Hi!" });
  })
  .listen(port, ({ port }) => {
    console.log(`Listening on ${port} port.`);
  });
console.log(`BOT STARTED`);
