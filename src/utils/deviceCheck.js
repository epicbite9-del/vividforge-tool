export const isLowEndDevice = () => {
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  const deviceMemory = navigator.deviceMemory || 4;
  return hardwareConcurrency < 4 || deviceMemory < 4;
};

export const getSafeResolution = (width, height) => {
  const MAX_PIXELS = isLowEndDevice() ? 2073600 : 8294400; 
  const currentPixels = width * height;

  if (currentPixels > MAX_PIXELS) {
    const ratio = Math.sqrt(MAX_PIXELS / currentPixels);
    return {
      width: Math.floor(width * ratio),
      height: Math.floor(height * ratio)
    };
  }
  return { width, height };
};
