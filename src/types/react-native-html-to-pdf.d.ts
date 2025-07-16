declare module 'react-native-html-to-pdf' {
  export interface Options {
    html: string;
    fileName: string;
    directory?: string;
    width?: number;
    height?: number;
    base64?: boolean;
    padding?: number;
    bgColor?: string;
  }

  export interface Result {
    filePath: string;
    base64?: string;
  }

  export default {
    convert: (options: Options) => Promise<Result>;
  };
} 