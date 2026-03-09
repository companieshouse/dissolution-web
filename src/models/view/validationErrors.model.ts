export type ValidationError = {
  message: string;
  alt_message?: string;
};

export default interface ValidationErrors {
  [property: string]: string | ValidationError;
}
