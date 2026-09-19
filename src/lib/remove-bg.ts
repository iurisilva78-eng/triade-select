/**
 * Remove o fundo de uma imagem de logo.
 * Tenta primeiro a API remove.bg (server-side, alta qualidade).
 * Cai de volta no algoritmo de flood-fill via canvas se a API não estiver disponível.
 */
export async function removeImageBackground(dataUrl: string): Promise<string> {
  // Tenta API remove.bg via servidor
  try {
    const blob   = dataUrlToBlob(dataUrl);
    const fd     = new FormData();
    fd.append("image", blob, "logo.png");

    const res = await fetch("/api/remove-bg", { method: "POST", body: fd });
    if (res.ok) {
      const buffer = await res.arrayBuffer();
      return bufferToDataUrl(buffer, "image/png");
    }
    // 503 = sem chave configurada, silenciosamente usa fallback
    if (res.status !== 503) {
      console.warn("[remove-bg] API retornou", res.status, "— usando fallback canvas");
    }
  } catch (err) {
    console.warn("[remove-bg] Erro na API, usando fallback canvas:", err);
  }

  return canvasFloodFill(dataUrl);
}

// ─── helpers ──────────────────────────────────────────────────

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(",");
  const mime        = meta.match(/:(.*?);/)?.[1] ?? "image/png";
  const bytes       = atob(b64);
  const arr         = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

function bufferToDataUrl(buffer: ArrayBuffer, mime: string): string {
  const bytes  = new Uint8Array(buffer);
  let binary   = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return `data:${mime};base64,${btoa(binary)}`;
}

function canvasFloodFill(dataUrl: string, tolerance = 35): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const w = img.width;
        const h = img.height;
        canvas.width  = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, w, h);
        const data      = imageData.data;

        // Amostra fundo em vários pontos das bordas
        const samples: [number, number][] = [
          [0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1],
          [Math.floor(w / 4), 0], [Math.floor(w * 3 / 4), 0],
          [Math.floor(w / 4), h - 1], [Math.floor(w * 3 / 4), h - 1],
          [0, Math.floor(h / 4)], [0, Math.floor(h * 3 / 4)],
          [w - 1, Math.floor(h / 4)], [w - 1, Math.floor(h * 3 / 4)],
        ];

        let bgR = 0, bgG = 0, bgB = 0;
        for (const [x, y] of samples) {
          const i = (y * w + x) * 4;
          bgR += data[i]; bgG += data[i + 1]; bgB += data[i + 2];
        }
        bgR = Math.round(bgR / samples.length);
        bgG = Math.round(bgG / samples.length);
        bgB = Math.round(bgB / samples.length);

        const colorDiff = (idx: number) => {
          const r = data[idx] - bgR, g = data[idx + 1] - bgG, b = data[idx + 2] - bgB;
          return Math.sqrt(r * r + g * g + b * b);
        };

        const visited = new Uint8Array(w * h);
        const queue: number[] = [];

        for (const p of [0, w - 1, w * (h - 1), w * h - 1]) {
          if (!visited[p] && colorDiff(p * 4) <= tolerance) {
            visited[p] = 1; queue.push(p);
          }
        }

        let qi = 0;
        while (qi < queue.length) {
          const p = queue[qi++];
          data[p * 4 + 3] = 0;
          const x = p % w, y = Math.floor(p / w);
          for (const n of [p - 1, p + 1, p - w, p + w]) {
            const nx = n % w, ny = Math.floor(n / w);
            if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
            if (!visited[n] && colorDiff(n * 4) <= tolerance) {
              visited[n] = 1; queue.push(n);
            }
          }
          void x; void y;
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
