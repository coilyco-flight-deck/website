import { openSync, readSync, closeSync } from "node:fs"

// Intrinsic dimensions straight from the file header, so markup cannot drift
// from the asset. Two formats only, and no dependency: the site ships none.

const PNG_SIGNATURE = "89504e470d0a1a0a"
// Start-of-frame markers carry the dimensions. C4, C8 and CC are huffman,
// arithmetic-coding and lossless markers that happen to sit in the same range.
const isStartOfFrame = (marker) =>
  marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)

const readHead = (file) => {
  const handle = openSync(file, "r")
  try {
    const buffer = Buffer.alloc(65_536)
    const read = readSync(handle, buffer, 0, buffer.length, 0)
    return buffer.subarray(0, read)
  } finally {
    closeSync(handle)
  }
}

const pngSize = (head) => ({
  width: head.readUInt32BE(16),
  height: head.readUInt32BE(20),
})

const jpegSize = (head, file) => {
  let offset = 2
  while (offset + 9 < head.length) {
    if (head[offset] !== 0xff) {
      throw new Error(`${file}: lost JPEG segment alignment at ${offset}`)
    }
    const marker = head[offset + 1]
    if (isStartOfFrame(marker)) {
      return {
        width: head.readUInt16BE(offset + 7),
        height: head.readUInt16BE(offset + 5),
      }
    }
    offset += 2 + head.readUInt16BE(offset + 2)
  }
  throw new Error(`${file}: no JPEG start-of-frame in the first 64K`)
}

export const imageSize = (file) => {
  const head = readHead(file)
  if (head.subarray(0, 8).toString("hex") === PNG_SIGNATURE)
    return pngSize(head)
  if (head[0] === 0xff && head[1] === 0xd8) return jpegSize(head, file)
  throw new Error(`${file}: not a PNG or JPEG`)
}
