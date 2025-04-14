import { WorkflowStep } from '@/features/ollama-api/streaming/api/workflow-step';
import { parse } from 'comment-parser';

export function dslToJson(dsl: string): WorkflowStep {
  const parsed = parse('/**\n' + dsl + '\n*/')[0]; // Take the first JSDoc block

  const workflow: WorkflowStep = {
    name: '',
    goal: parsed.description.trim(),
    module: '',
    function: '',
    params: {},
    returns: {},
  };

  for (const tag of parsed.tags) {
    switch (tag.tag) {
      case 'name':
        workflow.name = tag.name;
        break;
      case 'module':
        workflow.module = tag.name;
        break;
      case 'function':
        workflow.function = tag.name;
        break;
      case 'param':
        workflow.params![tag.name] = {
          type: tag.type,
          description: tag.description,
        };
        break;
      case 'returns':
        workflow.returns![tag.name] = {
          type: tag.type,
          description: tag.description,
        };
        break;
    }
  }

  return workflow;
}
