self.onmessage = async (e) => {
  const { type, file, options } = e.data;

  try {
    if (type === 'RESIZE') {
      const bitmap = await createImageBitmap(file);
      const { width, height, maintainAspect, format } = options;
      
      let newWidth = width;
      let newHeight = height;

      if (maintainAspect) {
        const ratio = bitmap.width / bitmap.height;
        if (width) newHeight = width / ratio;
        else if (height) newWidth = height * ratio;
      }

      const canvas = new OffscreenCanvas(newWidth, newHeight);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bitmap, 0, 0, newWidth, newHeight);

      const blob = await canvas.convertToBlob({ type: `image/${format}`, quality: 0.9 });
      self.postMessage({ success: true, blob });
    }
    
    if (type === 'UPSCALE') {
      const bitmap = await createImageBitmap(file);
      const scale = options.scale || 2;
      const newWidth = bitmap.width * scale;
      const newHeight = bitmap.height * scale;
      
      const canvas = new OffscreenCanvas(newWidth, newHeight);
      const ctx = canvas.getContext('2d');
      
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(bitmap, 0, 0, newWidth, newHeight);
      
      const blob = await canvas.convertToBlob({ type: 'image/png' });
      self.postMessage({ success: true, blob });
    }

  } catch (error) {
    self.postMessage({ success: false, error: error.message });
  }
};
