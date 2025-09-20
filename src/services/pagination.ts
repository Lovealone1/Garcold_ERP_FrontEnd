export type PageRequest = {
  page?: number;      
  pageSize?: number;   
  sort?: string;       
  q?: string;          
  [k: string]: unknown;
};

export type Page<T> = {
  items: T[];
  total: number;
  page: number;        
  pageSize: number;
};

export const toPage = <T>(raw: any): Page<T> => ({
  items: raw.items ?? raw.data ?? [],
  total: raw.total ?? raw.count ?? 0,
  page: raw.page ?? raw.current_page ?? 1,
  pageSize: raw.page_size ?? raw.per_page ?? raw.pageSize ?? 10,
});
