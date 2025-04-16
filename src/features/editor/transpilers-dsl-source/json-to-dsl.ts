// src/features/editor/transpilers-dsl-source/json-to-dsl.ts
import { WorkflowStep } from '@/features/chat/models/assistant-message';

const getTypeFromSchema = (schema: any): string => {
  if (!schema) return 'any';

  if (schema.type) {
    if (schema.type === 'array') {
      const itemsType = getTypeFromSchema(schema.items);
      return `${itemsType}[]`;
    }
    if (schema.type === 'object' && schema.properties) {
      const props = Object.entries(schema.properties)
        .map(([key, value]) => `${key}: ${getTypeFromSchema(value)}`)
        .join(', ');
      return `{ ${props} }`;
    }
    return schema.type;
  }

  if (schema.$ref) {
    return schema.$ref.split('/').pop() || 'any';
  }

  return 'any';
};

const getDescriptionFromSchema = (schema: any): string => {
  return schema.description || '';
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
    const type = getTypeFromSchema(json.returns);
    const description = getDescriptionFromSchema(json.returns);
    dsl += ` * @returns {${type}} ${description}\n`;
  }

  dsl += ' */';
  return dsl;
};
