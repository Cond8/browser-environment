import { cn } from '@/lib/utils';
import { ComponentPropsWithoutRef } from 'react';

export const markdownComponents = {
  p: ({ className, ...props }: ComponentPropsWithoutRef<'p'>) => (
    <p className={cn('leading-7 [&:not(:first-child)]:mt-6', className)} {...props} />
  ),
  h1: ({ className, ...props }: ComponentPropsWithoutRef<'h1'>) => (
    <h1
      className={cn('scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl', className)}
      {...props}
    />
  ),
  h2: ({ className, ...props }: ComponentPropsWithoutRef<'h2'>) => (
    <h2
      className={cn(
        'scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0',
        className,
      )}
      {...props}
    />
  ),
  h3: ({ className, ...props }: ComponentPropsWithoutRef<'h3'>) => (
    <h3 className={cn('scroll-m-20 text-2xl font-semibold tracking-tight', className)} {...props} />
  ),
  h4: ({ className, ...props }: ComponentPropsWithoutRef<'h4'>) => (
    <h4 className={cn('scroll-m-20 text-xl font-semibold tracking-tight', className)} {...props} />
  ),
  h5: ({ className, ...props }: ComponentPropsWithoutRef<'h5'>) => (
    <h5 className={cn('scroll-m-20 text-lg font-semibold tracking-tight', className)} {...props} />
  ),
  h6: ({ className, ...props }: ComponentPropsWithoutRef<'h6'>) => (
    <h6
      className={cn('scroll-m-20 text-base font-semibold tracking-tight', className)}
      {...props}
    />
  ),
  a: ({ className, ...props }: ComponentPropsWithoutRef<'a'>) => (
    <a className={cn('font-medium underline underline-offset-4', className)} {...props} />
  ),
  blockquote: ({ className, ...props }: ComponentPropsWithoutRef<'blockquote'>) => (
    <blockquote className={cn('mt-6 border-l-2 pl-6 italic', className)} {...props} />
  ),
  ul: ({ className, ...props }: ComponentPropsWithoutRef<'ul'>) => (
    <ul className={cn('my-6 ml-6 list-disc [&>li]:mt-2', className)} {...props} />
  ),
  ol: ({ className, ...props }: ComponentPropsWithoutRef<'ol'>) => (
    <ol className={cn('my-6 ml-6 list-decimal [&>li]:mt-2', className)} {...props} />
  ),
  li: ({ className, ...props }: ComponentPropsWithoutRef<'li'>) => (
    <li className={cn('mt-2', className)} {...props} />
  ),
  code: ({ className, ...props }: ComponentPropsWithoutRef<'code'>) => (
    <code
      className={cn(
        'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm',
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
      } catch (e) {
        // If parsing fails, use original content
        console.debug('JSON parsing failed, using original content');
      }
    }

    return (
      <pre
        className={cn('mb-4 mt-6 overflow-x-auto rounded-lg border bg-muted p-4', className)}
        {...props}
      >
        {formattedContent}
      </pre>
    );
  },
  table: ({ className, ...props }: ComponentPropsWithoutRef<'table'>) => (
    <div className="my-6 w-full overflow-y-auto">
      <table className={cn('w-full', className)} {...props} />
    </div>
  ),
  tr: ({ className, ...props }: ComponentPropsWithoutRef<'tr'>) => (
    <tr className={cn('m-0 border-t p-0 even:bg-muted', className)} {...props} />
  ),
  th: ({ className, ...props }: ComponentPropsWithoutRef<'th'>) => (
    <th
      className={cn(
        'border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right',
        className,
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }: ComponentPropsWithoutRef<'td'>) => (
    <td
      className={cn(
        'border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right',
        className,
      )}
      {...props}
    />
  ),
};
