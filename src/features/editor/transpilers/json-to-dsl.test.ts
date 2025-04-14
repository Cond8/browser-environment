// src/features/editor/transpilers/json-to-dsl.test.ts
import { describe, expect, it } from 'vitest';
import { jsonToDsl } from './json-to-dsl';
import { DSL_EXAMPLE, JSON_EXAMPLE } from './transpiler.examples.test';

describe('jsonToDsl', () => {
  it('should correctly transpile JSON to DSL format', () => {
    const result = jsonToDsl(JSON.stringify(JSON_EXAMPLE));
    expect(result).toBe(DSL_EXAMPLE.trim());
  });

  it('should handle empty JSON input', () => {
    const result = jsonToDsl('{}');
    expect(result).toBe('');
  });

  it('should handle malformed JSON input', () => {
    expect(() => jsonToDsl('{invalid json}')).toThrow();
  });

  it('should handle missing interface properties', () => {
    const minimalJson = {
      interface: {
        name: 'Test',
        service: 'test',
        method: 'test',
        goal: 'test',
        params: [],
        returns: [],
      },
      steps: [],
    };

    const result = jsonToDsl(JSON.stringify(minimalJson));
    expect(result).toContain('INTERFACE Test');
    expect(result).toContain('SERVICE test');
    expect(result).toContain('METHOD test');
    expect(result).toContain('GOAL test');
  });
});
