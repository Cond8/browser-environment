import {
  addSpacesToTitle,
  formatSnakeCase,
  getClassColorClasses,
  getClassInfo,
  parseWithComments,
} from './yaml-interface-details';

type Step = {
  name: string;
  goal: string;
  input: { [key: string]: string }[] | string[];
  output: { [key: string]: string }[] | string[];
  class: string;
  method: string;
};

type Props = {
  data: { steps: Step[] };
};

export default function StepsDetails({ data: { steps } }: Props) {
  if (!steps || !Array.isArray(steps) || steps.length === 0) {
    return <div className="p-4 text-muted-foreground">No steps defined</div>;
  }

  return (
    <div className="space-y-6">
      {steps.map((step, index) => {
        const classInfo = getClassInfo(step.class);
        const colorClasses = getClassColorClasses(classInfo.category, classInfo.type);

        return (
          <div
            key={index}
            className="space-y-4 p-4 border rounded-2xl shadow-sm bg-card text-card-foreground"
          >
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Step {index + 1}</p>
              <h2 className="text-xl font-semibold">{addSpacesToTitle(step.name)}</h2>
              <p className="text-muted-foreground">{step.goal}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <h3 className="font-medium text-primary">Inputs</h3>
                <ul className="list-disc list-inside space-y-1">
                  {Array.isArray(step.input) &&
                    step.input.map((input: string | { [key: string]: string }, idx: number) => {
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
                      if (input && typeof input === 'object') {
                        const entries = Object.entries(input);
                        if (entries.length > 0) {
                          const [name, desc] = entries[0];
                          const parsedName = parseWithComments(name);
                          const parsedDesc = parseWithComments(desc);
                          return (
                            <li key={idx}>
                              <strong>{formatSnakeCase(parsedName.value)}</strong>
                              {parsedName.comment && (
                                <span className="text-muted-foreground">
                                  {' '}
                                  - {parsedName.comment}
                                </span>
                              )}
                              : {parsedDesc.value}
                              {parsedDesc.comment && (
                                <span className="text-muted-foreground">
                                  {' '}
                                  - {parsedDesc.comment}
                                </span>
                              )}
                            </li>
                          );
                        }
                      }
                      return null;
                    })}
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-primary">Outputs</h3>
                <ul className="list-disc list-inside space-y-1">
                  {Array.isArray(step.output) &&
                    step.output.map((output: string | { [key: string]: string }, idx: number) => {
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
                      if (output && typeof output === 'object') {
                        const entries = Object.entries(output);
                        if (entries.length > 0) {
                          const [name, desc] = entries[0];
                          const parsedName = parseWithComments(name);
                          const parsedDesc = parseWithComments(desc);
                          return (
                            <li key={idx}>
                              <strong>{formatSnakeCase(parsedName.value)}</strong>
                              {parsedName.comment && (
                                <span className="text-muted-foreground">
                                  {' '}
                                  - {parsedName.comment}
                                </span>
                              )}
                              : {parsedDesc.value}
                              {parsedDesc.comment && (
                                <span className="text-muted-foreground">
                                  {' '}
                                  - {parsedDesc.comment}
                                </span>
                              )}
                            </li>
                          );
                        }
                      }
                      return null;
                    })}
                </ul>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>
                <strong>Class:</strong> {addSpacesToTitle(step.class)}{' '}
                <span className={`px-2 py-1 rounded-md text-xs font-medium ${colorClasses}`}>
                  {classInfo.category} - {classInfo.type}
                </span>
              </p>
              <p>
                <strong>Method:</strong> {formatSnakeCase(parseWithComments(step.method).value)}
                {parseWithComments(step.method).comment && (
                  <span className="text-muted-foreground">
                    {' '}
                    - {parseWithComments(step.method).comment}
                  </span>
                )}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
