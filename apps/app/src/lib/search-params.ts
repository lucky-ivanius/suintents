export type SearchParamValue = string | string[] | undefined;
export type SearchParams = { [key: string]: SearchParamValue };

export const toArray = (value: SearchParamValue): string[] => {
  if (Array.isArray(value)) return value;

  return value ? [value] : [];
};
