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
        'group space-y-4 p-6 rounded-2xl transition-all duration-300',
        'bg-gradient-to-br from-card to-card/80',
        'shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.3)]',
        'hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.4)]',
        'border-2 backdrop-blur-sm',
        isStep ? 'border-muted-foreground/10' : 'border-primary/20',
      )}
    >
      <div className="space-y-2">
        <p className="text-sm font-medium tracking-wide text-primary">
          {isStep ? 'Step' : 'Interface'}
        </p>
        <h2 className="text-2xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
          {addSpacesToTitle(data.name)}
        </h2>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <p className="text-sm font-medium text-primary">Class:</p>
          <span className="text-lg font-semibold">{addSpacesToTitle(data.class)}</span>
          <span
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium tracking-wide',
              'transition-all duration-300',
              colorClasses,
              'hover:scale-105 hover:shadow-sm',
            )}
          >
            {classInfo.category} - {classInfo.type}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm font-medium text-primary">Method:</p>
          <span className="text-lg font-semibold">
            {formatSnakeCase(parseWithComments(data.method).value)}
            {parseWithComments(data.method).comment && (
              <span className="text-muted-foreground ml-2">
                - {parseWithComments(data.method).comment}
              </span>
            )}
          </span>
        </div>
        <p className="text-lg leading-relaxed font-light text-foreground">{data.goal}</p>
      </div>

      <div className="grid grid-cols-2 gap-6 text-sm">
        <div className="space-y-2">
          <h3 className="font-medium tracking-wide text-primary">Inputs</h3>
          <ul className="list-none space-y-2">
            {Array.isArray(data.inputs) &&
              data.inputs.map((input: string | { [key: string]: string }, idx: number) => {
                if (typeof input === 'string') {
                  const parsed = parseWithComments(input);
                  return (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/50" />
                      <div>
                        <span className="font-medium">{parsed.value}</span>
                        {parsed.comment && (
                          <span className="text-muted-foreground ml-2">- {parsed.comment}</span>
                        )}
                      </div>
                    </li>
                  );
                }
                const [name, desc] = Object.entries(input)[0];
                const parsedName = parseWithComments(name);
                const parsedDesc = parseWithComments(desc);
                return (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/50" />
                    <div>
                      <strong className="font-medium">{formatSnakeCase(parsedName.value)}</strong>
                      {parsedName.comment && (
                        <span className="text-muted-foreground ml-2">- {parsedName.comment}</span>
                      )}
                      <span className="block text-muted-foreground">
                        {parsedDesc.value}
                        {parsedDesc.comment && <span className="ml-2">- {parsedDesc.comment}</span>}
                      </span>
                    </div>
                  </li>
                );
              })}
          </ul>
        </div>
        <div className="space-y-2">
          <h3 className="font-medium tracking-wide text-primary">Outputs</h3>
          <ul className="list-none space-y-2">
            {Array.isArray(data.outputs) &&
              data.outputs.map((output: string | { [key: string]: string }, idx: number) => {
                if (typeof output === 'string') {
                  const parsed = parseWithComments(output);
                  return (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/50" />
                      <div>
                        <span className="font-medium">{parsed.value}</span>
                        {parsed.comment && (
                          <span className="text-muted-foreground ml-2">- {parsed.comment}</span>
                        )}
                      </div>
                    </li>
                  );
                }
                const [name, desc] = Object.entries(output)[0];
                const parsedName = parseWithComments(name);
                const parsedDesc = parseWithComments(desc);
                return (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/50" />
                    <div>
                      <strong className="font-medium">{formatSnakeCase(parsedName.value)}</strong>
                      {parsedName.comment && (
                        <span className="text-muted-foreground ml-2">- {parsedName.comment}</span>
                      )}
                      <span className="block text-muted-foreground">
                        {parsedDesc.value}
                        {parsedDesc.comment && <span className="ml-2">- {parsedDesc.comment}</span>}
                      </span>
                    </div>
                  </li>
                );
              })}
          </ul>
        </div>
      </div>

      {/* Render Steps if provided and this is not already a step card */}
      {!isStep && steps && steps.length > 0 && (
        <div className="space-y-4 pt-6 mt-6 border-t border-muted-foreground/10">
          <h3 className="text-lg font-semibold tracking-wide text-primary">Steps</h3>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <InterfaceCard key={index} interface={step} isStep={true} />
            ))}
          </div>
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
