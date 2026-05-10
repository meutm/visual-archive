import { writeFile } from "node:fs/promises";

const albums = [
  {
    id: "album-01",
    folderId: "1fnZ0AIqq2c4Ojc8QTi-u1lAl4cqIWb0t",
  },
  {
    id: "album-02",
    folderId: "1lpYNJcB8OGHewZC3C2Z-8HjpLACgC-a5",
  },
  {
    id: "album-03",
    folderId: "11QejKVrYn3h5q5_AgiEWajErDKHWyMAj",
  },
  {
    id: "album-04",
    folderId: "1gg3E5B6zp5BIyPjWYa4MvD8UC32hGmsH",
  },
  {
    id: "album-05",
    folderId: "1mFvKeTL4o7fL3ZdXuh_0vr1t9Zbi7jqs",
  },
];

function decodeHtml(value = "") {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function cleanPhotoName(name) {
  return decodeHtml(name).replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
}

function getTitle(html) {
  const match = html.match(/<title>(.*?)<\/title>/i);
  return decodeHtml(match?.[1] || "Album").replace(/\s+-\s+Google Drive$/i, "");
}

function getEntries(html, album) {
  const entryRegex =
    /<div class="flip-entry" id="entry-([^"]+)"[\s\S]*?<a href="https:\/\/drive\.google\.com\/file\/d\/([^/]+)\/view[^"]*"[\s\S]*?<img src="([^"]+)" alt="([^"]*)"/g;

  return [...html.matchAll(entryRegex)].map((match, index) => {
    const [, entryId, fileId, thumbUrl, alt] = match;
    const filenameMatch = html
      .slice(match.index, match.index + 3500)
      .match(/<div class="flip-entry-title">([\s\S]*?)<\/div>/);
    const rawName = decodeHtml(filenameMatch?.[1]?.replace(/<[^>]+>/g, "").trim() || alt || entryId);

    return {
      id: fileId,
      albumId: album.id,
      name: rawName,
      title: cleanPhotoName(rawName),
      thumbnailUrl: thumbUrl.replace(/=s\d+$/, "=s900"),
      largeUrl: `https://drive.google.com/thumbnail?id=${fileId}&sz=w2200`,
      driveUrl: `https://drive.google.com/file/d/${fileId}/view`,
      sort: index + 1,
    };
  });
}

async function fetchAlbum(album) {
  const url = `https://drive.google.com/embeddedfolderview?id=${album.folderId}#grid`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Could not load folder ${album.folderId}: ${response.status}`);
  }

  const html = await response.text();
  const title = getTitle(html);
  const photos = getEntries(html, album);

  return {
    album: {
      ...album,
      title,
      subtitle: `${photos.length} photos`,
    },
    photos,
  };
}

const results = await Promise.all(albums.map(fetchAlbum));
const data = {
  generatedAt: new Date().toISOString(),
  albums: results.map((result) => result.album),
  photos: results.flatMap((result) => result.photos),
};

await writeFile(
  new URL("../photos-data.js", import.meta.url),
  `window.MEU_PHOTO_DATA = ${JSON.stringify(data, null, 2)};\n`,
);

console.log(`Generated ${data.photos.length} photos across ${data.albums.length} albums.`);
