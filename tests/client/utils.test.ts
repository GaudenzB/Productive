import { cn } from '../../client/src/lib/utils';

describe('Utils Functions', () => {
  describe('cn (className merging utility)', () => {
    test('should merge multiple class strings', () => {
      const result = cn('class1', 'class2');
      expect(result).toBe('class1 class2');
    });

    test('should handle conditional classes', () => {
      const condition = true;
      const result = cn('base-class', condition && 'conditional-class');
      expect(result).toBe('base-class conditional-class');
    });

    test('should filter out falsy values', () => {
      const result = cn('base-class', false && 'not-included', null, undefined, 0, '', 'included');
      expect(result).toBe('base-class included');
    });

    test('should handle Tailwind CSS class merges correctly', () => {
      const result = cn(
        'p-4 rounded',
        'text-sm md:text-base',
        true && 'bg-blue-500',
        false && 'bg-red-500'
      );
      expect(result).toBe('p-4 rounded text-sm md:text-base bg-blue-500');
    });

    test('should handle array inputs', () => {
      const classArray = ['class1', 'class2'];
      const result = cn('base', ...classArray);
      expect(result).toBe('base class1 class2');
    });

    test('should handle complex conditional expressions', () => {
      const isActive = true;
      const isDisabled = false;
      const size = 'large';
      
      const result = cn(
        'base-component',
        isActive ? 'active' : 'inactive',
        isDisabled && 'disabled',
        {
          'size-sm': size === 'small',
          'size-md': size === 'medium',
          'size-lg': size === 'large',
        }
      );
      
      expect(result).toBe('base-component active size-lg');
    });
  });
});