// src/features/editor/transpilers/json-to-js.ts
import { WorkflowStep } from '@/features/ollama-api/streaming/api/workflow-step';
import { jsonToDsl } from './json-to-dsl';

export const jsonToJs = (json: WorkflowStep[]): string => {
  if (!json || json.length === 0) {
    return '';
  }

  // Get the main workflow step (first one typically)
  const mainStep = json[0];

  // Start building the JS output
  let output = `export { CoreRedprint, StrictKVStoreService, createDirector, createRole } from '@cond8/core';\n\n`;

  // Add JSDoc for the main workflow using jsonToDsl
  output += jsonToDsl(mainStep) + '\n';

  // Create the main workflow director
  output += `export const ${mainStep.name}Workflow = createDirector(
  '${mainStep.name}',
  '${mainStep.goal}',
).init(input => ({
  conduit: new AppConduit(input),
  recorder: null,
}))(c8 => {
`;

  // Add initialization code for main parameters
  if (mainStep.params) {
    Object.keys(mainStep.params).forEach(paramName => {
      output += `  const ${paramName} = c8.body.get('${paramName}');\n`;
      output += `  c8.var('${paramName}', ${paramName});\n\n`;
    });
  }

  output += `  return c8;\n});\n\n`;

  // Add workflow steps
  output += `// Workflow Steps\n${mainStep.name}Workflow(\n`;

  // Process each step (starting from the second step if it exists)
  const stepsToProcess = json.slice(1);
  if (stepsToProcess.length === 0) {
    // If there's only one step, process it
    stepsToProcess.push(mainStep);
  }

  stepsToProcess.forEach((step, index) => {
    output += `  // STEP ${index + 1} — ${step.name}\n`;
    output += `  createRole(
    '${step.name}',
    "${step.goal}",
  )(c8 => {`;

    // Add variables and service calls
    if (step.params) {
      // Get parameters from previous variables
      Object.keys(step.params).forEach(paramName => {
        output += `\n    const ${paramName} = c8.var('${paramName}');`;
      });
    }

    // Add service method call
    if (step.module && step.function) {
      output += `\n    const { `;

      // Add return properties
      if (step.returns) {
        output += Object.keys(step.returns).join(', ');
      }

      output += ` } =\n      c8.${step.module}.${step.function}(`;

      // Add parameters to method call
      if (step.params) {
        output += Object.keys(step.params)
          .map(param => param)
          .join(',\n      ');
      }

      output += `\n    );`;

      // Store return values in variables
      if (step.returns) {
        Object.keys(step.returns).forEach(returnKey => {
          output += `\n    c8.var('${returnKey}', ${returnKey});`;
        });
      }
    }

    // For the last step, add a return statement if it's not already there
    if (index === stepsToProcess.length - 1 && step.returns) {
      const returnKeys = Object.keys(step.returns);
      if (returnKeys.length > 0) {
        output += `\n    return c8.return({ ${returnKeys.join(', ')} });`;
      } else {
        output += `\n    return c8;`;
      }
    } else {
      output += `\n    return c8;`;
    }

    output += `\n  })`;

    if (index < stepsToProcess.length - 1) {
      output += ',\n';
    } else {
      output += '\n';
    }
  });

  output += ');\n\n';

  // Add default export with final result
  const finalReturns = json[json.length - 1].returns;
  if (finalReturns) {
    const finalReturnKeys = Object.keys(finalReturns);
    if (finalReturnKeys.length > 0) {
      output += `export default ${mainStep.name}Workflow.fin(c8 => c8.var('${finalReturnKeys[0]}'));\n\n`;
    }
  }

  // Add service classes
  const services = new Set<string>();
  json.forEach(step => {
    if (step.module) {
      services.add(step.module);
    }
  });

  // Create service classes
  services.forEach(service => {
    const capitalizedService = service.charAt(0).toUpperCase() + service.slice(1);
    output += `class ${capitalizedService}Service extends CoreBlueprint {
  constructor(key) {
    super(key);
  }
\n`;

    // Add methods for each service
    const methodsForService = json.filter(step => step.module === service);
    const uniqueMethods = new Map();

    methodsForService.forEach(step => {
      // Skip if we've already defined this method for this service
      if (uniqueMethods.has(step.function)) return;
      uniqueMethods.set(step.function, true);

      // Add JSDoc for the method using jsonToDsl with proper indentation
      const jsDoc = jsonToDsl(step)
        .split('\n')
        .map(line => `  ${line}`)
        .join('\n');
      output += `${jsDoc}\n`;

      // Add method definition
      output += `  ${step.function}(`;

      // Add parameters
      if (step.params) {
        output += Object.keys(step.params).join(', ');
      }

      output += `) {
    `;

      // Declare return variables
      if (step.returns) {
        const returnVars = Object.keys(step.returns);
        if (returnVars.length === 1) {
          output += `let ${returnVars[0]}`;
          if (step.returns[returnVars[0]].type === 'boolean') {
            output += ` = false`;
          } else if (step.returns[returnVars[0]].type === 'number') {
            output += ` = 0`;
          } else if (step.returns[returnVars[0]].type === 'string') {
            output += ` = ''`;
          }
          output += `;`;
        } else {
          output += `let ${returnVars.join(', ')};`;
        }
      } else {
        output += 'let result;';
      }

      output += `
    return { `;

      // Return object
      if (step.returns) {
        output += Object.keys(step.returns).join(', ');
      } else {
        output += 'result';
      }

      output += ` };
  }
\n`;
    });

    output += `}\n\n`;
  });

  // Add AppConduit class
  output += `class AppConduit extends CoreRedprint {
  constructor(input) {
    super(input);
  }

  locals = new StrictKVStoreService('locals');\n`;

  // Add service instances
  services.forEach(service => {
    const capitalizedService = service.charAt(0).toUpperCase() + service.slice(1);
    output += `  ${service} = new ${capitalizedService}Service('${service}');\n`;
  });

  output += `}\n`;

  return output;
};
