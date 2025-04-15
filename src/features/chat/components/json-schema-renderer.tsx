import { cn } from '@/lib/utils';
import { ListChecks, Type } from 'lucide-react';

// Utility function to convert PascalCase/camelCase to Space Case
const toSpaceCase = (input: unknown): string => {
  if (!input) return '';

  if (Array.isArray(input)) {
    return input.map(item => toSpaceCase(item)).join(' | ');
  }

  if (typeof input !== 'string') {
    return String(input);
  }

  return input
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
    .trim(); // Remove any leading/trailing spaces
};

// Format a default value for display
const formatDefaultValue = (value: unknown): string => {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return `"${value}"`;
  if (Array.isArray(value)) return `[${value.map(formatDefaultValue).join(', ')}]`;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

interface PropertyDefinition {
  type: string | string[] | unknown;
  description?: string;
  optional?: boolean;
  default?: unknown;
  format?: string;
  enum?: string[];
  required?: string[];
  additionalProperties?: boolean;
  items?: {
    type: string | string[] | unknown;
    description?: string;
    default?: unknown;
    format?: string;
    properties?: Record<string, PropertyDefinition>;
    required?: string[];
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
  isRequired = false,
}: {
  name: string;
  property: PropertyDefinition;
  level?: number;
  isRequired?: boolean;
}) => {
  const hasNestedProperties = property.properties && Object.keys(property.properties).length > 0;
  const isArray = Array.isArray(property.type)
    ? property.type.includes('array')
    : property.type === 'array';
  const hasEnum = property.enum && property.enum.length > 0;
  const hasDefault = property.default !== undefined;
  const hasFormat = property.format !== undefined;
  const hasAdditionalProperties = property.additionalProperties !== undefined;

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <Type className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{toSpaceCase(name)}</span>
            {isRequired && <span className="text-xs text-destructive shrink-0">(required)</span>}
            {!isRequired && property.optional && (
              <span className="text-xs text-muted-foreground shrink-0">(optional)</span>
            )}
            <span className="text-xs text-muted-foreground shrink-0">
              ({toSpaceCase(property.type)})
            </span>
            {hasFormat && (
              <span className="text-xs text-muted-foreground shrink-0">({property.format})</span>
            )}
          </div>
          {property.description && (
            <p className="text-xs text-muted-foreground">{property.description}</p>
          )}
          {hasDefault && (
            <div className="mt-1 flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Default:</span>
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                {formatDefaultValue(property.default)}
              </code>
            </div>
          )}
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
          {hasAdditionalProperties && (
            <div className="mt-1">
              <span className="text-xs text-muted-foreground">
                Additional properties: {property.additionalProperties ? 'allowed' : 'not allowed'}
              </span>
            </div>
          )}
          {isArray && property.items && (
            <div className="mt-1 pl-4 border-l-2 border-muted">
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Items:</span> {property.items.description}
                {property.items.format && (
                  <span className="text-muted-foreground"> ({property.items.format})</span>
                )}
                {property.items.default !== undefined && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-muted-foreground">Default:</span>
                    <code className="bg-muted px-1.5 py-0.5 rounded">
                      {formatDefaultValue(property.items.default)}
                    </code>
                  </div>
                )}
                {property.items.properties && (
                  <div className="mt-2 space-y-2">
                    {Object.entries(property.items.properties).map(([itemName, itemProperty]) => (
                      <PropertyDisplay
                        key={itemName}
                        name={itemName}
                        property={itemProperty}
                        isRequired={property.items?.required?.includes(itemName)}
                      />
                    ))}
                  </div>
                )}
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
              isRequired={property.required?.includes(nestedName)}
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
