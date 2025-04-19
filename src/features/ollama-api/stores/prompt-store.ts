import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Note: Use {{userRequest}} and {{interfaceResponse}} in prompt templates for interpolation.

// Define the keys for each prompt phase
// js: JavaScript code generation phase
// alignment: Alignment of the generated code
// interface: Interface definition phase
// rules: Rules definition phase

/**
 * Keys for the PromptStore
 */
type PromptKey =
  | 'jsCodeTemplate'
  | 'jsCodeOutput'
  | 'alignmentStyle'
  | 'interfaceDefinition'
  | 'interfaceResponse'
  | 'rulesDefinition'
  | 'jsFunctionName'
  | 'jsFunctionDescription'
  | 'jsFunctionParameters'
  | 'jsFunctionReturnType'
  | 'alignmentIndentation'
  | 'alignmentNewline'
  | 'interfaceName'
  | 'interfaceDescription'
  | 'interfaceProperties'
  | 'rulesName'
  | 'rulesDescription'
  | 'rulesConditions';

interface PromptStore {
  // js phase prompts
  /**
   * Template for the JavaScript code generation phase
   */
  jsCodeTemplate: string;
  /**
   * Output of the JavaScript code generation phase
   */
  jsCodeOutput: string;
  /**
   * Name of the JavaScript function
   */
  jsFunctionName: string;
  /**
   * Description of the JavaScript function
   */
  jsFunctionDescription: string;
  /**
   * Parameters of the JavaScript function
   */
  jsFunctionParameters: string;
  /**
   * Return type of the JavaScript function
   */
  jsFunctionReturnType: string;

  // alignment phase prompts
  /**
   * Style of alignment for the generated code
   */
  alignmentStyle: string;
  /**
   * Indentation for the alignment phase
   */
  alignmentIndentation: string;
  /**
   * Newline character for the alignment phase
   */
  alignmentNewline: string;

  // interface phase prompts
  /**
   * Definition of the interface
   */
  interfaceDefinition: string;
  /**
   * Response of the interface definition phase
   */
  interfaceResponse: string;
  /**
   * Name of the interface
   */
  interfaceName: string;
  /**
   * Description of the interface
   */
  interfaceDescription: string;
  /**
   * Properties of the interface
   */
  interfaceProperties: string;

  // rules phase prompts
  /**
   * Definition of the rules
   */
  rulesDefinition: string;
  /**
   * Name of the rules
   */
  rulesName: string;
  /**
   * Description of the rules
   */
  rulesDescription: string;
  /**
   * Conditions of the rules
   */
  rulesConditions: string;

  // Setters for string-keyed updates
  /**
   * Sets a prompt value by key
   * @param key The key of the prompt to update
   * @param value The new value of the prompt
   */
  setPromptByKey: (key: PromptKey, value: string) => void;
}

const usePromptStore = create<PromptStore>()(
  persist(
    immer((set) => ({
      // Default values for each prompt phase
      jsCodeTemplate: 'Write a JavaScript function to {{userRequest}}',
      jsCodeOutput: '',
      jsFunctionName: 'myFunction',
      jsFunctionDescription: 'A JavaScript function to {{userRequest}}',
      jsFunctionParameters: '',
      jsFunctionReturnType: 'void',
      alignmentStyle: 'standard',
      alignmentIndentation: '  ',
      alignmentNewline: '\n',
      interfaceDefinition: 'Define an interface for {{interfaceResponse}}',
      interfaceResponse: '',
      interfaceName: 'MyInterface',
      interfaceDescription: 'An interface for {{interfaceResponse}}',
      interfaceProperties: '',
      rulesDefinition: 'Define rules for {{interfaceResponse}}',
      rulesName: 'MyRules',
      rulesDescription: 'Rules for {{interfaceResponse}}',
      rulesConditions: '',

      // Setters for string-keyed updates
      setPromptByKey: (key, value) =>
        set((state) => {
          state[key] = value;
        }),
    })),
    {
      name: 'prompt-store', // name of the item in localStorage
    }
  )
);

export default usePromptStore;
