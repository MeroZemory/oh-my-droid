import { describe, it, expect } from 'vitest';
import { omdToolsServer, omdToolNames, getOmdToolNames } from '../mcp/omd-tools-server.js';

describe('omd-tools-server', () => {
  describe('omdToolNames', () => {
    it('should export 18 tools total', () => {
      expect(omdToolNames).toHaveLength(18);
    });

    it('should have 12 LSP tools', () => {
      const lspTools = omdToolNames.filter(n => n.includes('lsp_'));
      expect(lspTools).toHaveLength(12);
    });

    it('should have 2 AST tools', () => {
      const astTools = omdToolNames.filter(n => n.includes('ast_'));
      expect(astTools).toHaveLength(2);
    });

    it('should have python_repl tool', () => {
      expect(omdToolNames).toContain('mcp__omd-tools__python_repl');
    });

    it('should use correct MCP naming format', () => {
      omdToolNames.forEach(name => {
        expect(name).toMatch(/^mcp__omd-tools__/);
      });
    });
  });

  describe('getOmdToolNames', () => {
    it('should return all tools by default', () => {
      const tools = getOmdToolNames();
      expect(tools).toHaveLength(18);
    });

    it('should filter out LSP tools when includeLsp is false', () => {
      const tools = getOmdToolNames({ includeLsp: false });
      expect(tools.some(t => t.includes('lsp_'))).toBe(false);
      expect(tools).toHaveLength(6); // 2 AST + 1 python + 3 skills
    });

    it('should filter out AST tools when includeAst is false', () => {
      const tools = getOmdToolNames({ includeAst: false });
      expect(tools.some(t => t.includes('ast_'))).toBe(false);
      expect(tools).toHaveLength(16); // 12 LSP + 1 python + 3 skills
    });

    it('should filter out python_repl when includePython is false', () => {
      const tools = getOmdToolNames({ includePython: false });
      expect(tools.some(t => t.includes('python_repl'))).toBe(false);
      expect(tools).toHaveLength(17); // 12 LSP + 2 AST + 3 skills
    });

    it('should filter out skills tools', () => {
      const names = getOmdToolNames({ includeSkills: false });
      expect(names).toHaveLength(15);
      expect(names.every(n => !n.includes('load_omd_skills') && !n.includes('list_omd_skills'))).toBe(true);
    });

    it('should have 3 skills tools', () => {
      const skillsTools = omdToolNames.filter(n => n.includes('load_omd_skills') || n.includes('list_omd_skills'));
      expect(skillsTools).toHaveLength(3);
    });
  });

  describe('omdToolsServer', () => {
    it('should be defined', () => {
      expect(omdToolsServer).toBeDefined();
    });
  });
});
