import { FilterModel } from "ag-grid-community";
import qs from "qs";

export const fetcher = async (...args: [RequestInfo, RequestInit?]) =>
  fetch(...args).then((res) => res.json());

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const postFetcher = async (url: string, { arg }: { arg: any }) => {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(arg),
  });

  if (!res.ok) {
    const errorBody = await res.json();
    const error = new Error(
      errorBody?.message || `POST ${url} failed with status ${res.status}`
    );

    throw error;
  }

  return res.json();
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const putFetcher = async (url: string, { arg }: { arg: any }) => {
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(arg),
  });

  if (!res.ok) {
    const errorBody = await res.json();
    const error = new Error(
      errorBody?.message || `PUT ${url} failed with status ${res.status}`
    );

    throw error;
  }

  return res.json();
};

const fieldTypeToWhere = (fieldName: string, filterConfig: FilterModel) => {
  const { type, filter, ...rest } = filterConfig;
  const filterType = type || "contains";
  const filterValue = filter || Object.values(rest)[0];
  const where: Record<string, any> = {};
  if (!filterValue) return;

  switch (filterType) {
    case "blank":
      where[fieldName] = null;
      break;
    case "notBlank":
      where[fieldName] = { not: null };
      break;
    case "equals":
      if (filterValue === '""' || filterValue === "''") {
        where[fieldName] = { equals: "" };
      } else {
        where[fieldName] = filterValue;
      }
      break;
    case "notEqual":
      if (filterValue === '""' || filterValue === "''") {
        where[fieldName] = { not: "" };
      } else {
        where[fieldName] = { not: filterValue };
      }
      break;
    case "contains":
      where[fieldName] = { contains: filterValue, mode: "insensitive" };
      break;
    case "startsWith":
      where[fieldName] = { startsWith: filterValue, mode: "insensitive" };
      break;
    case "endsWith":
      where[fieldName] = { endsWith: filterValue, mode: "insensitive" };
      break;
    case "greaterThan":
      where[fieldName] = {
        gt: isNaN(Number(filterValue)) ? filterValue : Number(filterValue),
      };
      break;
    case "lessThan":
      where[fieldName] = {
        lt: isNaN(Number(filterValue)) ? filterValue : Number(filterValue),
      };
      break;
    case "between":
      const { from, to } = filterConfig as {
        from?: string | number;
        to?: string | number;
      };

      if (from && to) {
        where[fieldName] = {
          gte: isNaN(Number(from)) ? from : Number(from),
          lte: isNaN(Number(to)) ? to : Number(to),
        };
      }
      break;
    case "in":
      const values = Array.isArray(filterValue) ? filterValue : [filterValue];

      where[fieldName] = { in: values };
      break;
    default:
      where[fieldName] = { contains: filterValue, mode: "insensitive" };
  }

  return where;
};

export const buildWhereClause = (searchParams: URLSearchParams | string) => {
  let prismaWhere: Record<string, any> = {};
  const parsed = qs.parse(searchParams.toString());

  if (parsed.filter && typeof parsed.filter === "object") {
    Object.entries(parsed.filter).forEach(([fieldName, filterConfig]) => {
      if (typeof filterConfig === "object" && filterConfig !== null) {
        if ("conditions" in filterConfig && "operator" in filterConfig) {
          // combined conditions
          const operator = (filterConfig.operator || "AND").toString();
          const { type, filter } = (
            filterConfig.conditions as FilterModel[]
          )[0] as { type: string[]; filter: string[] };
          console.log("combined conditions", filterConfig);
          const conditions: FilterModel[] = type
            .map((_, idx) =>
              fieldTypeToWhere(fieldName, {
                type: type[idx],
                filter: filter[idx],
              })
            )
            .filter(Boolean) as FilterModel[];

          prismaWhere = {
            ...prismaWhere,
            ...{ [operator.toUpperCase()]: conditions },
          };
        } else {
          // single condition
          console.log("single condition", filterConfig);
          prismaWhere = {
            ...prismaWhere,
            ...fieldTypeToWhere(fieldName, filterConfig),
          };
        }
      } else {
        console.log("fallback");
        prismaWhere = {
          ...prismaWhere,
          ...fieldTypeToWhere(fieldName, {
            type: "contains",
            filter: filterConfig,
          }),
        };
      }
    });
  }

  return prismaWhere;
};

// Helper to build query strings for client-side
export const buildQueryString = (filters: FilterModel): string => {
  if (!filters || Object.keys(filters).length === 0) return "";

  const query = qs.stringify(
    { filter: filters },
    {
      encode: false,
      arrayFormat: "brackets",
    }
  );

  return query ? `?${query}` : "";
};
