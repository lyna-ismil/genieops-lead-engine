import React from 'react';

export type GenieButtonVariant = 'primary' | 'secondary';

export type GenieButtonProps<T extends React.ElementType = 'button'> = {
  as?: T;
  variant?: GenieButtonVariant;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'className' | 'children'>;

const GenieButton = <T extends React.ElementType = 'button'>(
  props: GenieButtonProps<T>
) => {
  const { as, variant = 'secondary', className, children, ...rest } = props;
  const Component = as || 'button';

  return (
    <Component
      className={`genie-button genie-button--${variant} ${className || ''}`.trim()}
      {...rest}
    >
      {children}
    </Component>
  );
};

export default GenieButton;
