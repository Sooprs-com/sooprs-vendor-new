declare module 'react-native-sound' {
  export default class Sound {
    static MAIN_BUNDLE: string;
    static setCategory(
      category: string,
      mixWithOthers?: boolean,
    ): void;
    constructor(
      filename: string,
      basePath: string,
      onError?: (error: any) => void,
    );
    play(onEnd?: (success: boolean) => void): this;
    stop(): this;
    release(): void;
    setNumberOfLoops(loops: number): this;
  }
}
