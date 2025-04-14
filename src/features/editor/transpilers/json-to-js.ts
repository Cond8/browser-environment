// src/features/editor/transpilers/json-to-js.ts
import { WorkflowStep } from '@/features/ollama-api/tool-schemas/workflow-schema';

interface ParsedJson {
  interface: WorkflowStep;
  steps: WorkflowStep[];
}

// Assume CoreBlueprint is globally available or imported elsewhere in the target JS environment
declare var CoreBlueprint: any;

// Helper function to extract type and description from "type - description" format
function extractTypeAndDescription(typeWithComment: string): [string, string] {
  const parts = typeWithComment.split(' - ');
  if (parts.length >= 2) {
    return [parts[0], parts.slice(1).join(' - ')];
  }
  return [typeWithComment, ''];
}

// Map LLM types to TypeScript/JSDoc types
function mapTypeToJsDocType(type: string): string {
  const typeMap: Record<string, string> = {
    text: 'string',
    string: 'string',
    number: 'number',
    boolean: 'boolean',
    function: 'Function',
    object: 'Object',
    array: 'Array',
  };

  return typeMap[type.toLowerCase()] || 'any';
}

export const jsonToJs = (jsonContent: string): string => {
  // Handle empty input
  if (jsonContent === '{}') return '';

  // Parse JSON
  let parsedJson: ParsedJson;
  try {
    parsedJson = JSON.parse(jsonContent);
  } catch (error) {
    throw new Error('Invalid JSON format');
  }

  // Ensure required parts exist
  if (!parsedJson.interface) {
    return '';
  }

  const { interface: intf, steps = [] } = parsedJson;

  // --- Generate JS Code ---

  let jsOutput = `export { createDirector, CoreRedprint, StrictKVStoreService } from '@cond8/core';

`;

  // Workflow Definition
  jsOutput += `export const ${intf.name}Workflow = createDirector(
  '${intf.name}',
  '${intf.goal}',
).init(input => ({
  conduit: new AppConduit(input),
  recorder: null,
}))(
  c8 => {
`;
  // Initial params from c8.body
  if (intf.params) {
    Object.entries(intf.params).forEach(([param, type]) => {
      jsOutput += `    const ${param} = c8.body.get('${param}');
`;
      jsOutput += `    c8.var('${param}', ${param});

`;
    });
  }
  jsOutput += `    return c8;
  }
)

`;

  // Only add workflow steps if they exist
  if (steps.length > 0) {
    jsOutput += `${intf.name}Workflow(
`;
    steps.forEach((step: WorkflowStep, index: number) => {
      jsOutput += `  c8 => {
`;
      // Get params from c8.var
      if (step.params) {
        Object.keys(step.params).forEach(param => {
          jsOutput += `    const ${param} = c8.var('${param}');
`;
        });
      }
      // Service method call
      const returnsString = step.returns ? Object.keys(step.returns).join(', ') : '';
      const paramsString = step.params ? Object.keys(step.params).join(', ') : '';
      jsOutput += `    const { ${returnsString} } = c8.${step.service}.${step.method}(${paramsString});
`;
      // Store returns in c8.var
      if (step.returns) {
        Object.keys(step.returns).forEach(ret => {
          jsOutput += `    c8.var('${ret}', ${ret});
`;
        });
      }
      jsOutput += `    return c8;
  }${index < steps.length - 1 ? ',' : ''}
`;
    });
    jsOutput += `)

`;
  }

  // Workflow Finalization
  const finalReturnsString = intf.returns
    ? Object.keys(intf.returns)
        .map(ret => `c8.var('${ret}')`)
        .join(', ')
    : '';
  jsOutput += `export default ${intf.name}Workflow.fin(c8 => [${finalReturnsString}]);

`;

  // Generate service classes if there are steps
  if (steps.length > 0) {
    const serviceNames = [...new Set(steps.map((step: WorkflowStep) => step.service))];
    serviceNames.forEach((service: string) => {
      const serviceClassName = service.charAt(0).toUpperCase() + service.slice(1) + 'Service';
      jsOutput += `class ${serviceClassName} extends CoreBlueprint {
  constructor(key) {
    super(key);
  }

`;
      steps
        .filter((step: WorkflowStep) => step.service === service)
        .forEach((step: WorkflowStep) => {
          const paramsString = step.params ? Object.keys(step.params).join(', ') : '';
          const returnsString = step.returns ? Object.keys(step.returns).join(', ') : '';

          jsOutput += `  /**
   * ${step.goal}
`;
          if (step.params) {
            Object.entries(step.params).forEach(([param, typeWithComment]) => {
              const [type, description] = extractTypeAndDescription(typeWithComment);
              jsOutput += `   * @param {${mapTypeToJsDocType(type)}} ${param} - ${description}
`;
            });
          }
          jsOutput += `   * @returns {Object} An object containing the return values
`;
          if (step.returns) {
            Object.entries(step.returns).forEach(([ret, typeWithComment]) => {
              const [type, description] = extractTypeAndDescription(typeWithComment);
              jsOutput += `   * @property {${mapTypeToJsDocType(type)}} ${ret} - ${description}
`;
            });
          }
          jsOutput += `   */
`;
          jsOutput += `  ${step.method}(${paramsString}) {
`;
          if (step.returns) {
            Object.keys(step.returns).forEach(ret => {
              jsOutput += `    let ${ret};
`;
            });
          }
          jsOutput += `    // Implement business logic here
`;
          jsOutput += `    return { ${returnsString} }
  }
`;
        });
      jsOutput += `}

`;
    });
  }

  // AppConduit Class at the end
  jsOutput += `class AppConduit extends CoreRedprint {
  constructor(input) {
    super(input);
  }

  locals = new StrictKVStoreService('locals');
`;
  // Only add services if there are steps
  if (steps.length > 0) {
    const serviceNames = [...new Set(steps.map((step: WorkflowStep) => step.service))];
    serviceNames.forEach((service: string) => {
      const serviceClassName = service.charAt(0).toUpperCase() + service.slice(1) + 'Service';
      jsOutput += `  ${service} = new ${serviceClassName}('${service}');
`;
    });
  }
  jsOutput += `}
`;

  return jsOutput.trim(); // Trim trailing whitespace
};
