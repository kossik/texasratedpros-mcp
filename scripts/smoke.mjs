const endpoint =
  process.env.MCP_ENDPOINT ?? "https://www.texasratedpros.com/api/mcp";

let nextId = 1;

async function rpc(method, params = {}) {
  const response = await fetch(endpoint, {
    method: "POST",
    redirect: "manual",
    headers: {
      Accept: "application/json, text/event-stream",
      "Content-Type": "application/json",
      "MCP-Protocol-Version": "2025-06-18",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method, params }),
  });
  if (response.status >= 300 && response.status < 400) {
    throw new Error(`${method} redirected to ${response.headers.get("location")}`);
  }
  const text = await response.text();
  if (!response.ok) throw new Error(`${method} returned ${response.status}: ${text}`);
  const payload = response.headers.get("content-type")?.includes("text/event-stream")
    ? JSON.parse(
        text
          .split("\n")
          .filter((line) => line.startsWith("data:"))
          .at(-1)
          .slice(5)
          .trim(),
      )
    : JSON.parse(text);
  if (payload.error) throw new Error(`${method}: ${JSON.stringify(payload.error)}`);
  return payload.result;
}

async function call(name, args = {}) {
  const result = await rpc("tools/call", { name, arguments: args });
  if (result.isError) {
    throw new Error(`${name}: ${result.content?.[0]?.text ?? "tool error"}`);
  }
  if (!result.structuredContent || typeof result.structuredContent !== "object") {
    throw new Error(`${name} returned no structuredContent`);
  }
  return result.structuredContent;
}

const initialized = await rpc("initialize", {
  protocolVersion: "2025-06-18",
  capabilities: {},
  clientInfo: { name: "texasratedpros-smoke", version: "1.0.0" },
});
if (initialized.serverInfo?.name !== "com.texasratedpros/rankings") {
  throw new Error(`Unexpected server name: ${initialized.serverInfo?.name}`);
}
if (initialized.serverInfo?.version !== "1.0.0") {
  throw new Error(`Unexpected server version: ${initialized.serverInfo?.version}`);
}

const [{ tools }, { resources }, { prompts }] = await Promise.all([
  rpc("tools/list"),
  rpc("resources/list"),
  rpc("prompts/list"),
]);
const expectedTools = [
  "list_metros",
  "list_categories",
  "get_rankings",
  "get_business_profile",
  "search_businesses",
  "compare_businesses",
  "get_score_breakdown",
  "get_methodology",
];
for (const name of expectedTools) {
  const tool = tools.find((candidate) => candidate.name === name);
  if (!tool) throw new Error(`Missing tool ${name}`);
  if (!tool.outputSchema) throw new Error(`Tool ${name} has no outputSchema`);
}
if (resources.length < 2) throw new Error("Expected methodology and llms resources");
if (prompts.length < 3) throw new Error("Expected three prompts");

for (const expectedName of ["methodology", "llms"]) {
  const resource = resources.find((candidate) => candidate.name === expectedName);
  if (!resource) throw new Error(`Missing ${expectedName} resource`);
  const read = await rpc("resources/read", { uri: resource.uri });
  if (!read.contents?.[0]?.text) {
    throw new Error(`${expectedName} resource returned no text`);
  }
}

const explainPrompt = prompts.find(
  (candidate) => candidate.name === "explain_ranking",
);
if (!explainPrompt) throw new Error("Missing explain_ranking prompt");
const prompt = await rpc("prompts/get", {
  name: explainPrompt.name,
  arguments: { metro: "austin", category: "house-cleaning" },
});
if (!prompt.messages?.length) {
  throw new Error("explain_ranking prompt returned no messages");
}

const ranking = await call("get_rankings", {
  metro: "austin",
  category: "house-cleaning",
  limit: 2,
});
if (!ranking.companies || ranking.companies.length < 2) {
  throw new Error("Representative ranking did not return two companies");
}
const slugs = ranking.companies.slice(0, 2).map((company) => company.slug);

await Promise.all([
  call("search_businesses", {
    metro: "austin",
    category: "house-cleaning",
    verified_only: true,
    limit: 2,
  }),
  call("compare_businesses", {
    slugs,
    metro: "austin",
    category: "house-cleaning",
  }),
  call("get_score_breakdown", {
    slug: slugs[0],
    metro: "austin",
    category: "house-cleaning",
  }),
  call("get_methodology"),
]);

console.log(
  `TexasRatedPros MCP ${initialized.serverInfo.version}: ${tools.length} tools, ${resources.length} resources, ${prompts.length} prompts — smoke passed`,
);
