export function lowercaseDeep<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(lowercaseDeep) as unknown as T;
  }

  if (obj && typeof obj === "object") {
    const newObj: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string") {
        newObj[key] = value.toLowerCase();
      } else if (value && typeof value === "object" && !(value instanceof Date)) {
        newObj[key] = lowercaseDeep(value);
      } else {
        newObj[key] = value;
      }
    }
    return newObj;
  }

  return obj;
}
export function lowercaseJson(json: string): string {
  const parsed = JSON.parse(json);
  const lowered = lowercaseDeep(parsed);
  return JSON.stringify(lowered);
}
function capitalizeString(value: string): string {
  return value
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function titleCaseDeep<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(titleCaseDeep) as unknown as T;
  }

  if (obj && typeof obj === "object") {
    const newObj: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string") {
        newObj[key] = capitalizeString(value);
      } else if (value && typeof value === "object" && !(value instanceof Date)) {
        newObj[key] = titleCaseDeep(value);
      } else {
        newObj[key] = value;
      }
    }
    return newObj;
  }

  return obj;
}



export function uppercaseJson(json: string): string {
  const parsed = JSON.parse(json);
  const capitalized = titleCaseDeep(parsed);
  return JSON.stringify(capitalized);
}

export function normalizeFullName(
  fName: string | null | undefined,
  mName: string | null | undefined,
  lName: string | null | undefined,
  suffix?: string | null | undefined  // ✅ optional 4th
): string {
  const normalize = (value: string | null | undefined): string =>
    value ? value.toLowerCase().replace(/\s+/g, "") : "";

  return [normalize(fName), normalize(mName), normalize(lName), normalize(suffix)]
    .filter(Boolean)
    .join("");
}