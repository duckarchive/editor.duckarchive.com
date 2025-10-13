import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export type BaseInstance = {
  id: string;
  [key: string]: any;
};
