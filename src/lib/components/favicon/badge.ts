export function badge(
  node: unknown,
  {
    imgSize,
    count,
    background,
    color
  }: { imgSize: number; count: number; background: string; color: string }
) {
  const n = node as { href: string };
  const setNotification = (imgSize: number, count: number, background: string, color: string) => {
    if (count > 0 && context) {
      context.drawImage(img, 0, 0, imgSize, imgSize);
      // Draw Notification Circle
      context.beginPath();
      context.arc(canvas.width - imgSize / 3, imgSize / 3, imgSize / 3, 0, 2 * Math.PI);
      context.fillStyle = background;
      context.fill();
      // Draw Notification Number
      const fontSize = (imgSize * 55) / 96;
      context.font = `${fontSize}px "helvetica", sans-serif`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillStyle = color;
      context.fillText(count.toString(), canvas.width - imgSize / 3, imgSize / 3);
      // Replace favicon
      n.href = canvas.toDataURL('image/png');
    }
  };
  const canvas = document.createElement('canvas');
  canvas.width = imgSize;
  canvas.height = imgSize;
  const context = canvas.getContext('2d');
  const img = document.createElement('img');

  const onLoad = () => setNotification(imgSize, count, background, color);
  img.addEventListener('load', onLoad);

  img.src = n.href;

  return {
    update({
      imgSize,
      count,
      background,
      color
    }: {
      imgSize: number;
      count: number;
      background: string;
      color: string;
    }) {
      setNotification(imgSize, count, background, color);
    },
    destroy() {
      img.removeEventListener('load', onLoad);
    }
  };
}
