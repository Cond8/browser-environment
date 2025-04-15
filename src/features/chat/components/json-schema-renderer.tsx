import { cn } from '@/lib/utils';
import { ListChecks, Type } from 'lucide-react';

// Utility function to convert PascalCase/camelCase to Space Case
const toSpaceCase = (str: string | undefined | null): string => {
  if (!str) return '';
  return str
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
    .trim(); // Remove any leading/trailing spaces
};

interface PropertyDefinition {
  type: string;
  description: string;
  optional?: boolean;
  enum?: string[];
  items?: {
    type: string;
    description: string;
  };
  properties?: Record<string, PropertyDefinition>;
}

interface JsonSchemaRendererProps {
  schema: Record<string, PropertyDefinition>;
  title: string;
  className?: string;
}

const PropertyDisplay = ({
  name,
  property,
  level = 0,
}: {
  name: string;
  property: PropertyDefinition;
  level?: number;
}) => {
  const hasNestedProperties = property.properties && Object.keys(property.properties).length > 0;
  const isArray = property.type === 'array';
  const hasEnum = property.enum && property.enum.length > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <Type className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{toSpaceCase(name)}</span>
            {property.optional && (
              <span className="text-xs text-muted-foreground shrink-0">(optional)</span>
            )}
            <span className="text-xs text-muted-foreground shrink-0">
              ({toSpaceCase(property.type)})
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{property.description}</p>
          {hasEnum && (
            <div className="mt-1 flex flex-wrap gap-1">
              {property.enum!.map(value => (
                <span
                  key={value}
                  className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                >
                  {value}
                </span>
              ))}
            </div>
          )}
          {isArray && property.items && (
            <div className="mt-1 pl-4 border-l-2 border-muted">
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Items:</span> {property.items.description}
              </div>
            </div>
          )}
        </div>
      </div>
      {hasNestedProperties && (
        <div className="pl-6 space-y-2">
          {Object.entries(property.properties!).map(([nestedName, nestedProperty]) => (
            <PropertyDisplay
              key={nestedName}
              name={nestedName}
              property={nestedProperty}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const JsonSchemaRenderer = ({ schema, title, className }: JsonSchemaRendererProps) => {
  if (!schema || Object.keys(schema).length === 0) return null;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <ListChecks className="h-4 w-4 text-muted-foreground shrink-0" />
        <h4 className="text-sm font-medium">{title}</h4>
      </div>
      <div className="grid gap-2 pl-6">
        {Object.entries(schema).map(([name, property]) => (
          <PropertyDisplay key={name} name={name} property={property} />
        ))}
      </div>
    </div>
  );
};
