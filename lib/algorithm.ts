import isEqual from "lodash/isEqual";
import isObject from "lodash/isObject";
import transform from "lodash/transform";

/**
 * This code is licensed under the terms of the MIT license
 * https://gist.github.com/Yimiprod/7ee176597fef230d1451
 *
 * Deep diff between two object, using lodash
 * @param  {Object} object Object compared
 * @param  {Object} base   Object to compare with
 * @return {Object}        Return a new object who represent the diff
 */
export const diff = <T extends object, U extends object>(
  object: T,
  base: U,
): Partial<T> => {
  const changes = (object: any, base: any): any => {
    return transform(object, (result: any, value: any, key: string) => {
      if (!isEqual(value, base[key])) {
        result[key] =
          isObject(value) && isObject(base[key])
            ? changes(value, base[key])
            : value;
      }
    });
  };

  return changes(object, base);
};
