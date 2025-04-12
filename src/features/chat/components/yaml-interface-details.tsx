// src/features/chat/components/interface-details.tsx
type Interface = {
  name: string;
  goal: string;
  input: { [key: string]: string }[] | string[];
  output: { [key: string]: string }[] | string[];
  class: string;
  method: string;
};

type Props = {
  data: { interface: Interface };
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

export default function InterfaceDetails({ data: { interface: data } }: Props) {
  const classInfo = getClassInfo(data.class);
  const colorClasses = getClassColorClasses(classInfo.category, classInfo.type);

  return (
    <div className="space-y-4 p-4 border rounded-2xl shadow-sm bg-card text-card-foreground">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Interface</p>
        <h2 className="text-xl font-semibold">{addSpacesToTitle(data.name)}</h2>
        <p className="text-muted-foreground">{data.goal}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <h3 className="font-medium text-primary">Inputs</h3>
          <ul className="list-disc list-inside space-y-1">
            {Array.isArray(data.input) &&
              data.input.map((input: string | { [key: string]: string }, idx: number) => {
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
          <h3 className="font-medium text-primary">Outputs</h3>
          <ul className="list-disc list-inside space-y-1">
            {Array.isArray(data.output) &&
              data.output.map((output: string | { [key: string]: string }, idx: number) => {
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

      <div className="text-sm text-muted-foreground">
        <p>
          <strong>Class:</strong> {addSpacesToTitle(data.class)}{' '}
          <span className={`px-2 py-1 rounded-md text-xs font-medium ${colorClasses}`}>
            {classInfo.category} - {classInfo.type}
          </span>
        </p>
        <p>
          <strong>Method:</strong> {formatSnakeCase(parseWithComments(data.method).value)}
          {parseWithComments(data.method).comment && (
            <span className="text-muted-foreground">
              {' '}
              - {parseWithComments(data.method).comment}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
