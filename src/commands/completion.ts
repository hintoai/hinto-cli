import type { Command } from 'commander';

const GROUPS = [
  'videos',
  'articles',
  'folders',
  'generate',
  'project',
  'publish',
  'templates',
  'export',
  'init',
  'completion',
];
const GLOBAL_FLAGS = ['--json', '--api-url', '--help', '--version'];

function bashScript(): string {
  return `# hinto bash completion
_hinto() {
  local cur groups flags
  cur="\${COMP_WORDS[COMP_CWORD]}"
  groups="${GROUPS.join(' ')}"
  flags="${GLOBAL_FLAGS.join(' ')}"
  if [ "$COMP_CWORD" -eq 1 ]; then
    COMPREPLY=( $(compgen -W "$groups" -- "$cur") )
  else
    COMPREPLY=( $(compgen -W "$flags" -- "$cur") )
  fi
}
complete -F _hinto hinto
`;
}

function zshScript(): string {
  return `#compdef hinto
# hinto zsh completion
_hinto() {
  local -a groups
  groups=(${GROUPS.join(' ')})
  if (( CURRENT == 2 )); then
    compadd -- \${groups[@]}
  else
    compadd -- ${GLOBAL_FLAGS.join(' ')}
  fi
}
compdef _hinto hinto
`;
}

function fishScript(): string {
  const groupLines = GROUPS.map(
    (g) => `complete -c hinto -n "__fish_use_subcommand" -a "${g}"`,
  ).join('\n');
  const flagLines = GLOBAL_FLAGS.map((f) => `complete -c hinto -l "${f.replace(/^--/, '')}"`).join(
    '\n',
  );
  return `# hinto fish completion\n${groupLines}\n${flagLines}\n`;
}

export function registerCompletion(program: Command): void {
  program
    .command('completion <shell>')
    .description('Output a shell completion script (bash | zsh | fish)')
    .action((shell: string) => {
      switch (shell) {
        case 'bash':
          process.stdout.write(bashScript());
          break;
        case 'zsh':
          process.stdout.write(zshScript());
          break;
        case 'fish':
          process.stdout.write(fishScript());
          break;
        default:
          process.stderr.write(`Unsupported shell: ${shell}. Use bash, zsh, or fish.\n`);
          process.exit(1);
      }
    });
}
