import qs from "qs";

export const buildWhereClause = (searchParams: URLSearchParams | string) => {
  const where: any = {};

  // Parse the query string into a nested object
  const parsed = qs.parse(searchParams.toString());

  if (parsed.filter && typeof parsed.filter === "object") {
    Object.entries(parsed.filter).forEach(([fieldName, filterConfig]) => {
      if (typeof filterConfig === "object" && filterConfig !== null) {
        const { type, filter, ...rest } = filterConfig as any;
        const filterType = type || "contains";
        const filterValue = filter || Object.values(rest)[0];

        if (!filterValue) return;

        switch (filterType) {
          case "blank":
            where[fieldName] = null;
            break;
          case "notBlank":
            where[fieldName] = { not: null };
            break;
          case "equals":
            where[fieldName] = filterValue;
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
              gt: isNaN(Number(filterValue))
                ? filterValue
                : Number(filterValue),
            };
            break;
          case "lessThan":
            where[fieldName] = {
              lt: isNaN(Number(filterValue))
                ? filterValue
                : Number(filterValue),
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
            const values = Array.isArray(filterValue)
              ? filterValue
              : [filterValue];

            where[fieldName] = { in: values };
            break;
          default:
            where[fieldName] = { contains: filterValue, mode: "insensitive" };
        }
      } else {
        // Simple string filter
        where[fieldName] = { contains: filterConfig, mode: "insensitive" };
      }
    });
  }

  return where;
};

// Helper to build query strings for client-side
export const buildQueryString = (filters: Record<string, any>): string => {
  if (!filters || Object.keys(filters).length === 0) return "";

  const query = qs.stringify(
    { filter: filters },
    {
      encode: false,
      arrayFormat: "brackets",
    },
  );

  return query ? `?${query}` : "";
};
