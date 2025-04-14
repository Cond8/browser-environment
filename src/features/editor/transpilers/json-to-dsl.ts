// src/features/editor/transpilers/json-to-dsl.ts
import { WorkflowStep } from '@/features/ollama-api/streaming/api/workflow-step';

export const jsonToDsl = (json: WorkflowStep) => {
  let dsl = `/**
 * ${json.goal}
 *
 * @name ${json.name}
 * @module ${json.module}
 * @function ${json.function}
`;

  if (json.params) {
    Object.entries(json.params).forEach(([paramName, paramInfo]) => {
      dsl += ` * @param {${paramInfo.type}} ${paramName} - ${paramInfo.description}\n`;
    });
  }

  if (json.returns && Object.keys(json.returns).length > 0) {
    Object.entries(json.returns).forEach(([returnKey, returnInfo]) => {
      dsl += ` * @returns {${returnInfo.type}} ${returnKey} - ${returnInfo.description}\n`;
    });
  }

  dsl += ' */';
  return dsl;
};
