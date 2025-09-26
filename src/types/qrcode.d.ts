declare module "qrcode" {
  export type ECLevel = "L" | "M" | "Q" | "H";
  export interface QRCodeToBufferOptions {
    errorCorrectionLevel?: ECLevel;
    margin?: number;
    width?: number;
    type?: "png";
  }
  export function toBuffer(text: string, opts?: QRCodeToBufferOptions): Promise<Uint8Array>;
}
