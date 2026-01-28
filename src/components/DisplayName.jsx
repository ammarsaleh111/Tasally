'use client';

import React from 'react';
import { getNameDirection } from '@/utils/nameUtils';

const DisplayName = ({ name, className = '', as: Component = 'span' }) => {
  const text = typeof name === 'string' ? name : '';
  const dir = getNameDirection(text);
  const classes = `name-text name-bidi ${className}`.trim();

  return (
    <Component dir={dir} className={classes}>
      {text}
    </Component>
  );
};

export default DisplayName;
