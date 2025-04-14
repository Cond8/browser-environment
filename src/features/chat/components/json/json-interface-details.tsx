// src/features/chat/components/json/json-interface-details.tsx
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface Interface {
  name: string;
  service: string;
  method: string;
  goal: string;
  params?: Record<string, string | { type: string; description: string }>;
  returns?: Record<string, string | { type: string; description: string }>;
}

type Props = {
  data: { interface?: Interface; steps?: Interface[] };
  isStep?: boolean;
};

// Utility function to parse either string or object format for type and description
export function parseWithComments(value: string | { type: string; description: string }): {
  type: string;
  description?: string;
} {
  // Handle new object format
  if (value && typeof value === 'object' && 'type' in value && 'description' in value) {
    return {
      type: value.type.trim(),
      description: value.description.trim(),
    };
  }

  // Handle string format
  const str = typeof value === 'string' ? value : '';
  if (!str) {
    return { type: '' };
  }

  // Handle string case with format "type - description"
  const parts = str.split(' - ');
  if (parts.length > 1) {
    return {
      type: parts[0].trim(),
      description: parts.slice(1).join(' - ').trim(),
    };
  }

  return { type: str.trim() };
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

// Utility function to determine service category and type
export function getServiceInfo(serviceName: string): {
  category: 'programmatic' | 'llm_based';
  type: 'simple' | 'complex';
} {
  const simpleProgrammatic = ['data', 'validate', 'io', 'storage', 'logic'];
  const complexProgrammatic = ['calculate', 'format', 'parse', 'extract'];
  const simpleLlm = ['understand', 'classify', 'summarize'];
  const complexLlm = ['process', 'generate', 'integrate', 'predict', 'transform'];

  if (simpleProgrammatic.includes(serviceName)) {
    return { category: 'programmatic', type: 'simple' };
  }
  if (complexProgrammatic.includes(serviceName)) {
    return { category: 'programmatic', type: 'complex' };
  }
  if (simpleLlm.includes(serviceName)) {
    return { category: 'llm_based', type: 'simple' };
  }
  if (complexLlm.includes(serviceName)) {
    return { category: 'llm_based', type: 'complex' };
  }
  return { category: 'programmatic', type: 'simple' }; // default fallback
}

// Utility function to get color classes for service info
export function getServiceColorClasses(category: string, type: string): string {
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
  const serviceInfo = getServiceInfo(data.service);
  const colorClasses = getServiceColorClasses(serviceInfo.category, serviceInfo.type);

  return (
    <Card
      className={cn(
        'group transition-all duration-300',
        isStep ? 'border-muted-foreground/10' : 'border-primary/20',
      )}
    >
      <CardHeader className="space-y-0.5">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            {isStep ? 'Step' : 'Interface'}
          </Badge>
          <Badge className={cn('text-xs', colorClasses)}>
            {serviceInfo.category} - {serviceInfo.type}
          </Badge>
        </div>
        <CardTitle className="text-lg">{addSpacesToTitle(data.name)}</CardTitle>
        <CardDescription className="leading-relaxed font-light text-sm">
          {data.goal}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        <Collapsible>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-2 py-1 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
            <span>More info...</span>
            <ChevronDown className="h-3 w-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 pt-2">
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <p className="text-xs font-medium text-primary">Service:</p>
                <span className="text-sm font-semibold">{addSpacesToTitle(data.service)}</span>
              </div>
              <div className="flex items-center gap-1">
                <p className="text-xs font-medium text-primary">Method:</p>
                <span className="text-sm font-semibold">
                  {formatSnakeCase(parseWithComments(data.method).type)}
                  {parseWithComments(data.method).description && (
                    <span className="text-muted-foreground ml-1">
                      - {parseWithComments(data.method).description}
                    </span>
                  )}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="space-y-0.5">
                <h3 className="text-xs font-medium tracking-wide text-primary">Params</h3>
                <ul className="list-none space-y-0.5">
                  {data.params &&
                    typeof data.params === 'object' &&
                    Object.entries(data.params).map(([name, typeWithComment], idx) => {
                      const { type, description } = parseWithComments(typeWithComment);
                      return (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="mt-1 h-1 w-1 rounded-full bg-primary/50" />
                          <div>
                            <strong className="font-medium">{formatSnakeCase(name)}</strong>
                            <span className="ml-1 text-xs text-muted-foreground">[{type}]</span>
                            {description && (
                              <span className="block text-muted-foreground text-xs">
                                {description}
                              </span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                </ul>
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xs font-medium tracking-wide text-primary">Returns</h3>
                <ul className="list-none space-y-0.5">
                  {data.returns &&
                    typeof data.returns === 'object' &&
                    Object.entries(data.returns).map(([name, typeWithComment], idx) => {
                      const { type, description } = parseWithComments(typeWithComment);
                      return (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="mt-1 h-1 w-1 rounded-full bg-primary/50" />
                          <div>
                            <strong className="font-medium">{formatSnakeCase(name)}</strong>
                            <span className="ml-1 text-xs text-muted-foreground">[{type}]</span>
                            {description && (
                              <span className="block text-muted-foreground text-xs">
                                {description}
                              </span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                </ul>
              </div>
            </div>

            {/* Render Steps if provided and this is not already a step card */}
            {!isStep && steps && steps.length > 0 && (
              <div className="space-y-1 pt-2 mt-2 border-t border-muted-foreground/10">
                <h3 className="text-xs font-semibold tracking-wide text-primary">Steps</h3>
                <div className="space-y-1">
                  {steps.map((step, index) => (
                    <InterfaceCard key={index} interface={step} isStep={true} />
                  ))}
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
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
