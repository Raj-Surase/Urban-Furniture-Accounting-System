export type FilterFieldType = 'text' | 'select' | 'number' | 'date';
export type FilterOperator = 'contains' | 'equals' | 'gte' | 'lte' | 'not_equals';

export interface FieldFilterOption {
  label: string;
  value: string;
}

export interface FieldFilterConfig {
  key: string;
  label: string;
  type: FilterFieldType;
  options?: FieldFilterOption[];
  placeholder?: string;
}

export interface ActiveFieldFilter {
  id: string;
  field: string;
  operator: FilterOperator;
  value: string | number;
}

/**
 * Safely resolves nested property paths (e.g. "customer.name" or "vendor.gstin")
 */
export function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current == null) return undefined;
    current = current[part];
  }
  return current;
}

/**
 * Evaluates an item against active field filters and global search.
 */
export function evaluateItemMatch(
  item: any,
  searchQuery: string,
  searchFields: string[],
  activeFilters: ActiveFieldFilter[]
): boolean {
  // 1. Evaluate global search query
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = searchFields.some((field) => {
      const val = getNestedValue(item, field);
      if (val == null) return false;
      return String(val).toLowerCase().includes(q);
    });
    if (!matchesSearch) return false;
  }

  // 2. Evaluate each active field filter (AND logic)
  for (const filter of activeFilters) {
    if (filter.value === '' || filter.value == null) continue;

    const rawValue = getNestedValue(item, filter.field);
    const filterVal = filter.value;

    switch (filter.operator) {
      case 'contains': {
        const strVal = String(rawValue ?? '').toLowerCase();
        if (!strVal.includes(String(filterVal).toLowerCase())) {
          return false;
        }
        break;
      }
      case 'equals': {
        if (typeof rawValue === 'number' || !isNaN(Number(filterVal))) {
          if (Number(rawValue) !== Number(filterVal)) {
            // Also check string comparison fallback
            if (String(rawValue ?? '').toLowerCase() !== String(filterVal).toLowerCase()) {
              return false;
            }
          }
        } else {
          if (String(rawValue ?? '').toLowerCase() !== String(filterVal).toLowerCase()) {
            return false;
          }
        }
        break;
      }
      case 'not_equals': {
        if (String(rawValue ?? '').toLowerCase() === String(filterVal).toLowerCase()) {
          return false;
        }
        break;
      }
      case 'gte': {
        const numVal = parseFloat(String(rawValue ?? '0'));
        const target = parseFloat(String(filterVal));
        if (!isNaN(numVal) && !isNaN(target)) {
          if (numVal < target) return false;
        } else {
          // Date string comparison fallback
          if (String(rawValue ?? '') < String(filterVal)) return false;
        }
        break;
      }
      case 'lte': {
        const numVal = parseFloat(String(rawValue ?? '0'));
        const target = parseFloat(String(filterVal));
        if (!isNaN(numVal) && !isNaN(target)) {
          if (numVal > target) return false;
        } else {
          // Date string comparison fallback
          if (String(rawValue ?? '') > String(filterVal)) return false;
        }
        break;
      }
    }
  }

  return true;
}

/**
 * Filter an array of items by search string and active field filters.
 */
export function filterItems<T>(
  items: T[],
  searchQuery: string,
  searchFields: string[],
  activeFilters: ActiveFieldFilter[]
): T[] {
  if (!items || !items.length) return [];
  if (!searchQuery.trim() && (!activeFilters || !activeFilters.length)) return items;

  return items.filter((item) => evaluateItemMatch(item, searchQuery, searchFields, activeFilters));
}
