// Copy the values of CLIENT_ARG_ environment variables from .env to .env.development

const envFile = await Deno.readTextFile(".env");
const clientEnvProdFile = await Deno.readTextFile("client/.env.production");

const getIsLineWithVar = (line: string) => line.trim() && !/^#/.test(line) && line.includes("=");

let output = "";
const envLines = envFile.split("\n").filter(getIsLineWithVar).filter((line) => /CLIENT_ARG_/.test(line));

for (const line of clientEnvProdFile.split("\n").filter(getIsLineWithVar)) {
  const [envProdVar, envProdValue] = line.split("=");

  if (envProdValue.charAt(0) === "$") {
    for (const envLine of envLines) {
      const [envVar, envValue] = envLine.replace("CLIENT_ARG_", "").replace(/#.*$/, "").split("=");

      if ("$" + envVar === envProdValue) output += `${envProdVar}=${envValue}\n`;
    }
  }
}

await Deno.writeTextFile("./client/.env.development", output);