export type Dict = Record<string, string>;

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  highlight?: boolean;
}

export interface FaqItem {
  q: string;
  a: string;
}
