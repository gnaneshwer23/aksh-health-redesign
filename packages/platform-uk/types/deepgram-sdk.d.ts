declare module "@deepgram/sdk" {
  export function createClient(apiKey: string): {
    listen: {
      prerecorded: {
        transcribeFile: (
          source: Buffer,
          options: { model: string; language: string; smart_format: boolean }
        ) => Promise<{
          result?: {
            results?: {
              channels?: Array<{
                alternatives?: Array<{ transcript?: string }>;
              }>;
            };
          };
          error?: unknown;
        }>;
      };
    };
  };
}
