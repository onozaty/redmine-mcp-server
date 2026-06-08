export type CliResult =
  | { handled: true; exitCode: number }
  | { handled: false };

export function handleCliMetadataFlags(
  argv: string[],
  version: string,
  out: Pick<NodeJS.WriteStream, "write"> = process.stdout,
  err: Pick<NodeJS.WriteStream, "write"> = process.stderr,
): CliResult {
  const args = argv.slice(2);

  if (args.length === 0) {
    return { handled: false };
  }

  if (args.includes("--help") || args.includes("-h")) {
    out.write(getHelpText());
    return { handled: true, exitCode: 0 };
  }

  if (args.includes("--version") || args.includes("-v")) {
    out.write(`${version}\n`);
    return { handled: true, exitCode: 0 };
  }

  const unknownOption = args.find((arg) => arg.startsWith("-"));
  if (unknownOption) {
    err.write(`Unknown option: ${unknownOption}\n\n${getHelpText()}`);
    return { handled: true, exitCode: 1 };
  }

  return { handled: false };
}

function getHelpText(): string {
  return `Usage: redmine-mcp-server [options]

Redmine MCP server over stdio.

Options:
  -h, --help       Display help for command
  -v, --version    Display package version
`;
}
