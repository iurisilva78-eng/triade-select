export async function removeImageBackground(
  dataUrl: string,
  tolerance = 35
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("no canvas context"));
      ctx.drawImage(img, 0, 0);

      const { width, height } = canvas;
      const data = ctx.getImageData(0, 0, width, height);
      const px = data.data;

      // Sample background color from edges (12 points)
      const samplePoints = [
        [0, 0], [Math.floor(width / 2), 0], [width - 1, 0],
        [0, Math.floor(height / 2)], [width - 1, Math.floor(height / 2)],
        [0, height - 1], [Math.floor(width / 2), height - 1], [width - 1, height - 1],
        [Math.floor(width / 4), 0], [Math.floor(width * 3 / 4), 0],
        [Math.floor(width / 4), height - 1], [Math.floor(width * 3 / 4), height - 1],
      ];

      let rSum = 0, gSum = 0, bSum = 0;
      for (const [x, y] of samplePoints) {
        const i = (y * width + x) * 4;
        rSum += px[i]; gSum += px[i + 1]; bSum += px[i + 2];
      }
      const n = samplePoints.length;
      const bgR = rSum / n, bgG = gSum / n, bgB = bSum / n;

      const colorDist = (i: number) => {
        const dr = px[i] - bgR, dg = px[i + 1] - bgG, db = px[i + 2] - bgB;
        return Math.sqrt(dr * dr + dg * dg + db * db);
      };

      // BFS flood-fill from all 4 corners
      const visited = new Uint8Array(width * height);
      const queue: number[] = [];

      const enqueue = (x: number, y: number) => {
        if (x < 0 || y < 0 || x >= width || y >= height) return;
        const idx = y * width + x;
        if (visited[idx]) return;
        const pi = idx * 4;
        if (colorDist(pi) <= tolerance) {
          visited[idx] = 1;
          queue.push(x, y);
        }
      };

      enqueue(0, 0);
      enqueue(width - 1, 0);
      enqueue(0, height - 1);
      enqueue(width - 1, height - 1);

      let qi = 0;
      while (qi < queue.length) {
        const x = queue[qi++];
        const y = queue[qi++];
        const pi = (y * width + x) * 4;
        px[pi + 3] = 0; // transparent
        enqueue(x + 1, y);
        enqueue(x - 1, y);
        enqueue(x, y + 1);
        enqueue(x, y - 1);
      }

      ctx.putImageData(data, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}
