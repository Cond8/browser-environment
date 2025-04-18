// src/features/chat/components/markdown-components.tsx
import { cn } from '@/lib/utils';
import { ComponentPropsWithoutRef } from 'react';

export const markdownComponents = {
  p: ({ className, ...props }: ComponentPropsWithoutRef<'p'>) => (
    <p
      className={cn('leading-7 tracking-normal [&:not(:first-child)]:mt-4', className)}
      {...props}
    />
  ),
  h1: ({ className, ...props }: ComponentPropsWithoutRef<'h1'>) => (
    <h1
      className={cn(
        'scroll-m-16 text-3xl font-bold tracking-tight lg:text-4xl leading-tight mt-6 mb-4',
        className,
      )}
      {...props}
    />
  ),
  h2: ({ className, ...props }: ComponentPropsWithoutRef<'h2'>) => (
    <h2
      className={cn(
        'scroll-m-16 border-b pb-2 text-2xl font-semibold tracking-tight first:mt-0 leading-tight mt-6 mb-4',
        className,
      )}
      {...props}
    />
  ),
  h3: ({ className, ...props }: ComponentPropsWithoutRef<'h3'>) => (
    <h3
      className={cn(
        'scroll-m-16 text-xl font-semibold tracking-tight leading-tight mt-6 mb-3',
        className,
      )}
      {...props}
    />
  ),
  h4: ({ className, ...props }: ComponentPropsWithoutRef<'h4'>) => (
    <h4
      className={cn(
        'scroll-m-16 text-lg font-semibold tracking-tight leading-tight mt-6 mb-2',
        className,
      )}
      {...props}
    />
  ),
  h5: ({ className, ...props }: ComponentPropsWithoutRef<'h5'>) => (
    <h5
      className={cn(
        'scroll-m-16 text-base font-semibold tracking-tight leading-tight mt-6 mb-2',
        className,
      )}
      {...props}
    />
  ),
  h6: ({ className, ...props }: ComponentPropsWithoutRef<'h6'>) => (
    <h6
      className={cn(
        'scroll-m-16 text-sm font-semibold tracking-tight leading-tight mt-6 mb-2',
        className,
      )}
      {...props}
    />
  ),
  a: ({ className, ...props }: ComponentPropsWithoutRef<'a'>) => (
    <a className={cn('font-medium underline underline-offset-2', className)} {...props} />
  ),
  blockquote: ({ className, ...props }: ComponentPropsWithoutRef<'blockquote'>) => (
    <blockquote className={cn('mt-3 border-l-2 pl-3 italic', className)} {...props} />
  ),
  ul: ({ className, ...props }: ComponentPropsWithoutRef<'ul'>) => (
    <ul className={cn('ml-6 list-disc space-y-2 my-4', className)} {...props} />
  ),
  ol: ({ className, ...props }: ComponentPropsWithoutRef<'ol'>) => (
    <ol className={cn('ml-6 list-decimal space-y-2 my-4', className)} {...props} />
  ),
  li: ({ className, ...props }: ComponentPropsWithoutRef<'li'>) => (
    <li className={cn('leading-7', className)} {...props} />
  ),
  code: ({ className, ...props }: ComponentPropsWithoutRef<'code'>) => (
    <code
      className={cn(
        'relative rounded bg-muted px-[0.2rem] py-[0.1rem] font-mono text-sm',
        className,
      )}
      {...props}
    />
  ),
  pre: ({ className, children, ...props }: ComponentPropsWithoutRef<'pre'>) => {
    // Try to parse as JSON if the content looks like JSON
    let formattedContent = children;
    if (typeof children === 'string' && children.trim().startsWith('{')) {
      try {
        const jsonObj = JSON.parse(children);
        formattedContent = JSON.stringify(jsonObj, null, 2);
      } catch (e: unknown) {
        // If parsing fails, use original content
        console.debug('JSON parsing failed, using original content', (e as Error)?.message);
      }
    }

    return (
      <pre
        className={cn('mb-2 mt-3 overflow-x-auto rounded-md border bg-muted p-2', className)}
        {...props}
      >
        {formattedContent}
      </pre>
    );
  },
  table: ({ className, ...props }: ComponentPropsWithoutRef<'table'>) => (
    <div className="my-3 w-full overflow-y-auto">
      <table className={cn('w-full text-sm', className)} {...props} />
    </div>
  ),
  tr: ({ className, ...props }: ComponentPropsWithoutRef<'tr'>) => (
    <tr className={cn('m-0 border-t p-0 even:bg-muted', className)} {...props} />
  ),
  th: ({ className, ...props }: ComponentPropsWithoutRef<'th'>) => (
    <th
      className={cn(
        'border px-2 py-1 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right',
        className,
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }: ComponentPropsWithoutRef<'td'>) => (
    <td
      className={cn(
        'border px-2 py-1 text-left [&[align=center]]:text-center [&[align=right]]:text-right',
        className,
      )}
      {...props}
    />
  ),
};
