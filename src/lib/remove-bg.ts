/**
 * Remove o fundo de uma imagem usando flood-fill pelos cantos via canvas.
 * Funciona bem para logos com fundo branco ou de cor sólida.
 * Retorna um PNG com fundo transparente.
 */
export async function removeImageBackground(
  dataUrl: string,
  tolerance = 35
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const w = img.width;
        const h = img.height;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;

        // Amostra cor de fundo nos cantos + bordas (mais robusto que só 4 cantos)
        const samples = [
          [0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1],
          [Math.floor(w / 4), 0], [Math.floor(w * 3 / 4), 0],
          [Math.floor(w / 4), h - 1], [Math.floor(w * 3 / 4), h - 1],
          [0, Math.floor(h / 4)], [0, Math.floor(h * 3 / 4)],
          [w - 1, Math.floor(h / 4)], [w - 1, Math.floor(h * 3 / 4)],
        ];

        let bgR = 0, bgG = 0, bgB = 0;
        for (const [x, y] of samples) {
          const i = (y * w + x) * 4;
          bgR += data[i];
          bgG += data[i + 1];
          bgB += data[i + 2];
        }
        bgR = Math.round(bgR / samples.length);
        bgG = Math.round(bgG / samples.length);
        bgB = Math.round(bgB / samples.length);

        // Distância de cor em relação ao fundo amostrado
        const colorDiff = (idx: number) => {
          const r = data[idx] - bgR;
          const g = data[idx + 1] - bgG;
          const b = data[idx + 2] - bgB;
          return Math.sqrt(r * r + g * g + b * b);
        };

        // BFS flood-fill partindo dos 4 cantos
        const visited = new Uint8Array(w * h);
        const queue: number[] = [];

        const seedPoints = [0, w - 1, w * (h - 1), w * h - 1];
        for (const p of seedPoints) {
          if (!visited[p] && colorDiff(p * 4) <= tolerance) {
            visited[p] = 1;
            queue.push(p);
          }
        }

        let qi = 0;
        while (qi < queue.length) {
          const p = queue[qi++];
          data[p * 4 + 3] = 0; // transparente

          const x = p % w;
          const y = Math.floor(p / w);

          if (x > 0 && !visited[p - 1] && colorDiff((p - 1) * 4) <= tolerance) {
            visited[p - 1] = 1;
            queue.push(p - 1);
          }
          if (x < w - 1 && !visited[p + 1] && colorDiff((p + 1) * 4) <= tolerance) {
            visited[p + 1] = 1;
            queue.push(p + 1);
          }
          if (y > 0 && !visited[p - w] && colorDiff((p - w) * 4) <= tolerance) {
            visited[p - w] = 1;
            queue.push(p - w);
          }
          if (y < h - 1 && !visited[p + w] && colorDiff((p + w) * 4) <= tolerance) {
            visited[p + w] = 1;
            queue.push(p + w);
          }
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => reject(new Error("Falha ao carregar imagem"));
    img.src = dataUrl;
  });
}
