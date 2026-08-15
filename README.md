# TexasRatedPros Rankings MCP

Public metadata, connection examples, and smoke tests for the free remote
[TexasRatedPros](https://www.texasratedpros.com) Model Context Protocol server.
The application server itself is maintained in a private proprietary repository.

- Endpoint: `https://www.texasratedpros.com/api/mcp`
- Registry name: `com.texasratedpros/rankings`
- Title: `TexasRatedPros Rankings`
- Version: `1.0.0`
- Transport: Streamable HTTP
- Access: read-only, no authentication, 60 requests/minute/IP

## Connect

Clients that support remote Streamable HTTP servers can use:

```json
{
  "mcpServers": {
    "texasratedpros": {
      "url": "https://www.texasratedpros.com/api/mcp"
    }
  }
}
```

For clients that only support stdio, use `mcp-remote`:

```json
{
  "mcpServers": {
    "texasratedpros": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://www.texasratedpros.com/api/mcp"
      ]
    }
  }
}
```

## Capabilities

The server publishes eight tools:

| Tool | Purpose |
| --- | --- |
| `list_metros` | Published metros and category slugs |
| `list_categories` | Categories and Texas licensing notes |
| `get_rankings` | A complete metro/category ranking |
| `get_business_profile` | Evidence, verification gaps, and all placements |
| `search_businesses` | Filter by name, metro, category, score, or active Texas entity match |
| `compare_businesses` | Compare two to four companies in one shared ranking context |
| `get_score_breakdown` | Rank, five weighted pillars, point contributions, and provenance |
| `get_methodology` | Weights, thresholds, sources, rules, and limitations |

It also publishes the `methodology` and `llms` resources and the `find_best`,
`vet_business`, and `explain_ranking` prompts. Tool results carry both concise
text and schema-validated `structuredContent`.

## Examples

- “Rank Austin house-cleaning companies and cite the as-of date.”
- “Search for companies matched to an active Texas entity record.”
- “Compare these companies in their shared Austin house-cleaning ranking.”
- “Explain all five pillars contributing to this company’s score.”

The MCP server, REST API, downloadable datasets, Markdown pages, and website all
read from the same service models. Useful links:

- [MCP documentation](https://www.texasratedpros.com/mcp)
- [Methodology](https://www.texasratedpros.com/methodology)
- [CSV and JSON datasets](https://www.texasratedpros.com/data)
- [Interactive API docs](https://www.texasratedpros.com/api/docs)
- [OpenAPI 3.1](https://www.texasratedpros.com/openapi.json)
- [API terms](https://www.texasratedpros.com/api-terms)
- [Privacy](https://www.texasratedpros.com/privacy)

## Registry listings

Version 1.0.0 was published after the production endpoint passed the public
smoke test. Official Registry entries are immutable, so later incompatible
releases use a new semantic version.

| Directory | Listing |
| --- | --- |
| Official MCP Registry | [Active: `com.texasratedpros/rankings@1.0.0`](https://registry.modelcontextprotocol.io/v0.1/servers?search=com.texasratedpros%2Frankings) |
| Smithery | [Published: `texasratedpros/rankings`](https://smithery.ai/servers/texasratedpros/rankings) |
| Glama | Pending registry import |
| PulseMCP | Pending registry import |
| MCP.so | Pending free community submission |

## Data and code licensing

Published TexasRatedPros ranking data is available under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Attribute
TexasRatedPros, preserve the canonical source URL and as-of date, and indicate
material changes. The MCP server implementation and application code are
proprietary and are not distributed by this repository.

## Verification

Run the live protocol smoke test with Node.js 20 or newer:

```sh
npm run smoke
```

The test initializes the legacy Streamable HTTP protocol, checks tool/resource/
prompt discovery, and calls ranking, search, comparison, score-breakdown, and
methodology tools against the public endpoint.
