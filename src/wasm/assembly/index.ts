// The entry file of your WebAssembly module.

export function add(a: i32, b: i32): i32 {
  return a + b;
}

export const computeAsciiString = (
  cols: i32,
  pixelArray: Int32Array,
  brightness: f32,
  contrast: f32,
  asciiMap: string
): string => {
  const clamp = (val: i32, min: i32, max: i32): i32 => {
    if (val <= min) return min;
    if (val >= max) return max;
    return val;
  };
  let newAsciiString = "";
  for (let i = 0; i < pixelArray.length; i++) {
    const f32PixelValue = pixelArray[i] as f32;
    const newPixelValue: i32 = ((f32PixelValue + brightness) * contrast) as i32;
    pixelArray[i] = clamp(newPixelValue, 0, 255);
    newAsciiString += asciiMap.charAt(clamp(pixelArray[i], 0, 255));
    if (i % cols === 0) newAsciiString += "\n";
  }
  return newAsciiString;
};

export const Int32Array_ID = idof<Int32Array>();
