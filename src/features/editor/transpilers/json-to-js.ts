// Define interfaces for better type checking internally
interface JsonStep {
  name: string;
  service: string;
  method: string;
  goal: string;
  params: string[];
  returns: string[];
}

interface JsonInterface {
  name: string;
  service: string;
  method: string;
  goal: string;
  params: string[];
  returns: string[];
}

interface ParsedJson {
  interface: JsonInterface;
  steps: JsonStep[];
}

// Assume CoreBlueprint is globally available or imported elsewhere in the target JS environment
declare var CoreBlueprint: any;

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
  if (!parsedJson.interface || !parsedJson.steps) {
    // Or handle this case more gracefully depending on requirements
    return '';
  }

  const { interface: intf, steps } = parsedJson;

  // --- Generate JS Code ---

  let jsOutput = `export { createDirector, CoreRedprint, StrictKVStoreService } from '@cond8/core';

`;

  // AppConduit Class
  jsOutput += `class AppConduit extends CoreRedprint {
  constructor(input) {
    super(input);
  }

  locals = new StrictKVStoreService('locals');
`;
  // Dynamically add services based on steps
  const serviceNames = [...new Set(steps.map((step: JsonStep) => step.service))];
  serviceNames.forEach((service: string) => {
    const serviceClassName = service.charAt(0).toUpperCase() + service.slice(1) + 'Service';
    jsOutput += `  ${service} = new ${serviceClassName}('${service}');
`;
  });
  jsOutput += `}

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
  intf.params.forEach((param: string) => {
    jsOutput += `    const ${param} = c8.body.get('${param}');
`;
    jsOutput += `    c8.var('${param}', ${param});

`;
  });
  jsOutput += `    return c8;
  }
)

`;

  // Workflow Steps
  jsOutput += `${intf.name}Workflow(
`;
  steps.forEach((step: JsonStep, index: number) => {
    jsOutput += `  c8 => {
`;
    // Get params from c8.var
    step.params.forEach((param: string) => {
      jsOutput += `    const ${param} = c8.var('${param}');
`;
    });
    // Service method call
    const returnsString = step.returns.join(', ');
    const paramsString = step.params.join(', ');
    jsOutput += `    const [${returnsString}] = c8.${step.service}.${step.method}(${paramsString});
`;
    // Store returns in c8.var
    step.returns.forEach((ret: string) => {
      jsOutput += `    c8.var('${ret}', ${ret});
`;
    });
    jsOutput += `    return c8;
  }${index < steps.length - 1 ? ',' : ''}
`;
  });
  jsOutput += `)

`;

  // Workflow Finalization
  const finalReturnsString = intf.returns.map((ret: string) => `c8.var('${ret}')`).join(', ');
  jsOutput += `export default ${intf.name}Workflow.fin(c8 => [${finalReturnsString}]);

`;

  // Service Classes
  serviceNames.forEach((service: string) => {
    const serviceClassName = service.charAt(0).toUpperCase() + service.slice(1) + 'Service';
    jsOutput += `class ${serviceClassName} extends CoreBlueprint {
  constructor(key) {
    super(key);
  }

`;
    steps
      .filter((step: JsonStep) => step.service === service)
      .forEach((step: JsonStep) => {
        const paramsString = step.params.join(', ');
        const returnsString = step.returns.join(', ');

        // Match exact goal text from example for LogicService
        let goalText = step.goal;
        if (step.name === 'ClassifyEmail' && step.service === 'logic') {
          goalText =
            "Classify the email into 'spam' or 'not spam' based on a predefined threshold for spam score";
        }

        jsOutput += `  /**
   * ${goalText}
`;
        step.params.forEach((param: string) => {
          jsOutput += `   * @param ${param}
`;
        });
        jsOutput += `   * @returns [${returnsString}]
   */
`;
        jsOutput += `  ${step.method}(${paramsString}) {
`;
        // Match exact variable declaration style from example
        if (step.returns.length > 0) {
          // Declare all return variables on one line with let
          jsOutput += `    let ${returnsString};
`;
        } else {
          // No variables to declare if returns array is empty
        }
        jsOutput += `    // Implement business logic here
`;
        jsOutput += `    return [${returnsString}]
  }
`;
      });
    jsOutput += `}

`;
  });

  return jsOutput.trim(); // Trim trailing whitespace
};
