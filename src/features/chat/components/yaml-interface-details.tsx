// src/features/chat/components/interface-details.tsx
import { cn } from '@/lib/utils';

type Interface = {
  name: string;
  goal: string;
  inputs: { [key: string]: string }[] | string[];
  outputs: { [key: string]: string }[] | string[];
  class: string;
  method: string;
};

type Props = {
  data: { interface?: Interface; steps?: Interface[] };
  isStep?: boolean;
};

// Utility function to parse a string with comments in parentheses
export function parseWithComments(str: string | undefined | null): {
  value: string;
  comment?: string;
} {
  if (!str) {
    return { value: '' };
  }

  const match = str.match(/^(.*?)\s*\((.*)\)$/);
  if (match) {
    return {
      value: match[1].trim(),
      comment: match[2].trim(),
    };
  }
  return { value: str.trim() };
}

// Utility function to add spaces before capital letters and capitalize words
export function addSpacesToTitle(str: string | undefined | null): string {
  if (!str) {
    return '';
  }
  return str
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .split(' ') // Split into words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize each word
    .join(' ') // Join back together
    .trim();
}

// Utility function to format snake_case to title case
export function formatSnakeCase(str: string | undefined | null): string {
  if (!str) {
    return '';
  }
  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();
}

// Utility function to determine class category and type
export function getClassInfo(className: string): {
  category: 'programmatic' | 'llm_based';
  type: 'simple' | 'complex';
} {
  const simpleProgrammatic = ['data', 'validate', 'io', 'storage', 'logic'];
  const complexProgrammatic = [
    'parse',
    'control',
    'auth',
    'notify',
    'schedule',
    'optimize',
    'calculate',
    'network',
    'encrypt',
  ];
  const simpleLlm = ['extract', 'format', 'understand'];
  const complexLlm = ['process', 'generate', 'integrate', 'predict', 'transform'];

  if (simpleProgrammatic.includes(className)) {
    return { category: 'programmatic', type: 'simple' };
  }
  if (complexProgrammatic.includes(className)) {
    return { category: 'programmatic', type: 'complex' };
  }
  if (simpleLlm.includes(className)) {
    return { category: 'llm_based', type: 'simple' };
  }
  if (complexLlm.includes(className)) {
    return { category: 'llm_based', type: 'complex' };
  }
  return { category: 'programmatic', type: 'simple' }; // default fallback
}

// Utility function to get color classes for class info
export function getClassColorClasses(category: string, type: string): string {
  if (category === 'programmatic' && type === 'simple') {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
  }
  if (category === 'programmatic' && type === 'complex') {
    return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100';
  }
  if (category === 'llm_based' && type === 'simple') {
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
  }
  if (category === 'llm_based' && type === 'complex') {
    return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
  }
  return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'; // default fallback
}

function InterfaceCard({
  interface: data,
  isStep = false,
  steps,
}: {
  interface: Interface;
  isStep?: boolean;
  steps?: Interface[];
}) {
  const classInfo = getClassInfo(data.class);
  const colorClasses = getClassColorClasses(classInfo.category, classInfo.type);

  return (
    <div
      className={cn(
        'space-y-4 p-4 rounded-2xl shadow-sm bg-card text-card-foreground',
        isStep
          ? 'border border-muted-foreground/10 bg-muted/10'
          : 'border-2 border-primary/30 bg-card shadow-md',
      )}
    >
      <div className="space-y-1">
        <p className={cn('text-sm', isStep ? 'text-muted-foreground' : 'text-primary')}>
          {isStep ? 'Step' : 'Interface'}
        </p>
        <h2 className={cn('font-semibold', isStep ? 'text-xl' : 'text-2xl')}>
          {addSpacesToTitle(data.name)}
        </h2>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <p
            className={cn('text-sm font-medium', isStep ? 'text-muted-foreground' : 'text-primary')}
          >
            Class:
          </p>
          <span className={cn('font-semibold', isStep ? 'text-base' : 'text-lg')}>
            {addSpacesToTitle(data.class)}
          </span>
          <span className={cn('px-2 py-1 rounded-md text-xs font-medium', colorClasses)}>
            {classInfo.category} - {classInfo.type}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <p
            className={cn('text-sm font-medium', isStep ? 'text-muted-foreground' : 'text-primary')}
          >
            Method:
          </p>
          <span className={cn('font-semibold', isStep ? 'text-base' : 'text-lg')}>
            {formatSnakeCase(parseWithComments(data.method).value)}
            {parseWithComments(data.method).comment && (
              <span className="text-muted-foreground ml-1">
                - {parseWithComments(data.method).comment}
              </span>
            )}
          </span>
        </div>
        <p className={cn('text-sm', isStep ? 'text-muted-foreground' : 'text-foreground')}>
          {data.goal}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <h3 className={cn('font-medium', isStep ? 'text-muted-foreground' : 'text-primary')}>
            Inputs
          </h3>
          <ul className="list-disc list-inside space-y-1">
            {Array.isArray(data.inputs) &&
              data.inputs.map((input: string | { [key: string]: string }, idx: number) => {
                if (typeof input === 'string') {
                  const parsed = parseWithComments(input);
                  return (
                    <li key={idx}>
                      {parsed.value}
                      {parsed.comment && (
                        <span className="text-muted-foreground"> - {parsed.comment}</span>
                      )}
                    </li>
                  );
                }
                const [name, desc] = Object.entries(input)[0];
                const parsedName = parseWithComments(name);
                const parsedDesc = parseWithComments(desc);
                return (
                  <li key={idx}>
                    <strong>{formatSnakeCase(parsedName.value)}</strong>
                    {parsedName.comment && (
                      <span className="text-muted-foreground"> - {parsedName.comment}</span>
                    )}
                    : {parsedDesc.value}
                    {parsedDesc.comment && (
                      <span className="text-muted-foreground"> - {parsedDesc.comment}</span>
                    )}
                  </li>
                );
              })}
          </ul>
        </div>
        <div>
          <h3 className={cn('font-medium', isStep ? 'text-muted-foreground' : 'text-primary')}>
            Outputs
          </h3>
          <ul className="list-disc list-inside space-y-1">
            {Array.isArray(data.outputs) &&
              data.outputs.map((output: string | { [key: string]: string }, idx: number) => {
                if (typeof output === 'string') {
                  const parsed = parseWithComments(output);
                  return (
                    <li key={idx}>
                      {parsed.value}
                      {parsed.comment && (
                        <span className="text-muted-foreground"> - {parsed.comment}</span>
                      )}
                    </li>
                  );
                }
                const [name, desc] = Object.entries(output)[0];
                const parsedName = parseWithComments(name);
                const parsedDesc = parseWithComments(desc);
                return (
                  <li key={idx}>
                    <strong>{formatSnakeCase(parsedName.value)}</strong>
                    {parsedName.comment && (
                      <span className="text-muted-foreground"> - {parsedName.comment}</span>
                    )}
                    : {parsedDesc.value}
                    {parsedDesc.comment && (
                      <span className="text-muted-foreground"> - {parsedDesc.comment}</span>
                    )}
                  </li>
                );
              })}
          </ul>
        </div>
      </div>

      {/* Render Steps if provided and this is not already a step card */}
      {!isStep && steps && steps.length > 0 && (
        <div className="space-y-4 pt-4 mt-4 border-t border-muted-foreground/10">
          <h3 className="text-lg font-semibold text-primary">Steps</h3>
          {steps.map((step, index) => (
            <InterfaceCard key={index} interface={step} isStep={true} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function InterfaceDetails({ data }: Props) {
  // Handle case where only steps might be present (though ideally an interface should exist)
  if (!data.interface && data.steps && data.steps.length > 0) {
    return (
      <div className="space-y-6 p-4 bg-muted/30">
        <p className="text-lg font-semibold text-primary">Steps</p>
        {data.steps.map((step, index) => (
          <InterfaceCard key={index} interface={step} isStep={true} />
        ))}
      </div>
    );
  }

  // Handle the primary case: render the interface, passing steps to it
  if (data.interface) {
    return <InterfaceCard interface={data.interface} steps={data.steps} />;
  }

  // Fallback if neither interface nor steps are defined
  return <div className="p-4 text-muted-foreground">No interface or steps defined</div>;
}
