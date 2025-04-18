// src/features/editor/transpilers-dsl-source/json-to-dsl.ts
import { WorkflowStep } from '@/features/ollama-api/streaming-logic/phases/types';

const getTypeFromSchema = (schema: { type: string } | undefined): string => {
  if (!schema) return 'any';

  if (schema.type) {
    return schema.type;
  }

  return 'any';
};

const getDescriptionFromSchema = (schema: { description: string } | undefined): string => {
  return schema?.description || '';
};

export const jsonToDsl = (json: WorkflowStep) => {
  let dsl = `/**
 * ${json.goal}
 *
 * @name ${json.name}
 * @module ${json.module}
 * @function ${json.functionName}
`;

  if (json.params) {
    Object.entries(json.params).forEach(([paramName, paramSchema]) => {
      const type = getTypeFromSchema(paramSchema);
      const description = getDescriptionFromSchema(paramSchema);
      dsl += ` * @param {${type}} ${paramName} - ${description}\n`;
    });
  }

  if (json.returns) {
    Object.entries(json.returns).forEach(([returnName, returnSchema]) => {
      const type = getTypeFromSchema(returnSchema);
      const description = getDescriptionFromSchema(returnSchema);
      dsl += ` * @returns {${type}} ${returnName} - ${description}\n`;
    });
  }

  dsl += ' */';
  return dsl;
};
