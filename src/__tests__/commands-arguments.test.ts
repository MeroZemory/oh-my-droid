import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const commandsDir = join(process.cwd(), 'commands');
const skillsDir = join(process.cwd(), 'skills');

function readCommand(name: string): string {
  return readFileSync(join(commandsDir, name), 'utf8');
}

describe('slash command argument placeholders', () => {
  it('uses droid-native $ARGUMENTS placeholders', () => {
    const commandOffenders = readdirSync(commandsDir)
      .filter((file) => file.endsWith('.md'))
      .filter((file) => readCommand(file).includes('{{ARGUMENTS}}'))
      .map((file) => join('commands', file));

    const skillOffenders = readdirSync(skillsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => join('skills', entry.name, 'SKILL.md'))
      .filter((file) => existsSync(file))
      .filter((file) => readFileSync(file, 'utf8').includes('{{ARGUMENTS}}'));

    expect([...commandOffenders, ...skillOffenders]).toEqual([]);
  });

  it('passes an initial task to /plan', () => {
    expect(readCommand('plan.md')).toContain('$ARGUMENTS');
  });
});
