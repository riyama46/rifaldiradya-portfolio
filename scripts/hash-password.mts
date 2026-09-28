// Creates the admin credentials for the environment (SDD section 9). Run in your own terminal:
//   npm run hash-password
// The password is typed hidden, never stored, and never leaves this machine. The printed hash is
// base64-encoded because `$` in a raw bcrypt hash breaks .env files and some host panels.
import { randomBytes } from "node:crypto";
import { stdin, stdout } from "node:process";
import { createInterface, type Interface } from "node:readline";
import { hashPassword } from "../lib/auth/password.ts";

const MIN_LENGTH = 12;

// One shared line reader for the non-TTY fallback: a new reader per question would swallow the
// lines buffered for the next one.
let lineReader: Interface | undefined;
let lines: AsyncIterator<string> | undefined;

async function readVisibleLine(prompt: string): Promise<string> {
  if (!lineReader) {
    lineReader = createInterface({ input: stdin });
    lines = lineReader[Symbol.asyncIterator]();
  }
  stdout.write(prompt);
  const next = await lines!.next();
  stdout.write("\n");
  return next.done ? "" : next.value;
}

async function askHidden(question: string): Promise<string> {
  if (!stdin.isTTY) {
    // Fallback for terminals without raw mode (e.g. Git Bash without winpty): input is visible.
    return readVisibleLine(`${question} (input will be visible) `);
  }

  stdout.write(question + " ");
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding("utf8");

  return new Promise((resolve) => {
    let value = "";
    const onData = (chunk: string) => {
      for (const char of chunk) {
        if (char === "\r" || char === "\n") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", onData);
          stdout.write("\n");
          resolve(value);
          return;
        }
        if (char === "\u0003") process.exit(130); // Ctrl+C
        if (char === "\u007f" || char === "\b") value = value.slice(0, -1);
        else value += char;
      }
    };
    stdin.on("data", onData);
  });
}

const password = await askHidden("New admin password:");
if (password.length < MIN_LENGTH) {
  console.error(`Use at least ${MIN_LENGTH} characters. Nothing was generated.`);
  process.exit(1);
}
const confirmation = await askHidden("Type it again:");
if (confirmation !== password) {
  console.error("The two passwords do not match. Nothing was generated.");
  process.exit(1);
}

lineReader?.close();

const hash = await hashPassword(password);
const encoded = Buffer.from(hash, "utf8").toString("base64");
const salt = randomBytes(32).toString("hex");

console.log(`
Set these as environment variables (Hostinger panel and/or .env.local), then restart the app:

ADMIN_EMAIL=<the email you will sign in with>
ADMIN_PASSWORD_HASH=${encoded}
RATE_LIMIT_SALT=${salt}

Keep them private: do not paste them into chats, issues, or commits.
Changing RATE_LIMIT_SALT only resets the login rate-limit counters.`);
