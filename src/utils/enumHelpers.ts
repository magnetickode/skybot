export const getEnumKeyByValue = (enumObj: Record<any, any>, value: any) =>
  Object.keys(enumObj).find((key) => enumObj[key] === value);
