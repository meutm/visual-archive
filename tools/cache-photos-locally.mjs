import { mkdir, readFile, writeFile } from "node:fs/promises";

const dataFile = new URL("../photos-data.js", import.meta.url);
const photosDir = new URL("../assets/photos/", import.meta.url);
const publicPrefix = "assets/photos";
const concurrency = 8;

function parseData(source) {
  return JSON.parse(
    source
      .replace(/^window\.MEU_PHOTO_DATA\s*=\s*/, "")
      .replace(/;\s*$/, ""),
  );
}

function getRemoteUrl(photo) {
  if (photo.sourceUrl) return photo.sourceUrl;
  if (photo.thumbnailUrl?.startsWith("http")) return photo.thumbnailUrl.replace(/=s\d+$/, "=s1600");
  return photo.largeUrl;
}

async function downloadPhoto(photo) {
  const filename = `${photo.id}.jpg`;
  const fileUrl = new URL(filename, photosDir);
  const remoteUrl = getRemoteUrl(photo);
  const response = await fetch(remoteUrl);

  if (!response.ok) {
    throw new Error(`${photo.name}: ${response.status} ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(fileUrl, buffer);

  photo.sourceUrl = remoteUrl;
  photo.thumbnailUrl = `${publicPrefix}/${filename}`;
  photo.largeUrl = `${publicPrefix}/${filename}`;
}

async function runQueue(items, worker) {
  let index = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (index < items.length) {
      const item = items[index++];
      await worker(item);
    }
  });

  await Promise.all(workers);
}

await mkdir(photosDir, { recursive: true });

const data = parseData(await readFile(dataFile, "utf8"));
await runQueue(data.photos, downloadPhoto);

await writeFile(dataFile, `window.MEU_PHOTO_DATA = ${JSON.stringify(data, null, 2)};\n`);

console.log(`Cached ${data.photos.length} photos locally in assets/photos.`);
